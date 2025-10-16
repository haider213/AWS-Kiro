from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import boto3
import json
import os
from dotenv import load_dotenv
import asyncio
from langchain_aws import BedrockEmbeddings, ChatBedrock
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import nltk
import re
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

# Load environment variables
load_dotenv()

# Also try loading from parent directory (backend/.env)
import os
from pathlib import Path
parent_env = Path(__file__).parent.parent / '.env'
if parent_env.exists():
    load_dotenv(parent_env)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

app = FastAPI(title="RAG Pipeline Educator - Python Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache and AWS clients
model_cache = {}
bedrock_client = None
bedrock_runtime = None

# Initialize AWS Bedrock clients
def init_bedrock_clients():
    global bedrock_client, bedrock_runtime
    try:
        session = boto3.Session()
        bedrock_client = session.client('bedrock', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        bedrock_runtime = session.client('bedrock-runtime', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        return True
    except Exception as e:
        print(f"Warning: Could not initialize Bedrock clients: {e}")
        return False

# Initialize on startup
bedrock_available = init_bedrock_clients()

# Pydantic models
class ChunkingRequest(BaseModel):
    text: str
    strategy: str = "fixed-size"
    chunk_size: int = 200
    overlap: int = 50
    parent_chunk_size: Optional[int] = 800
    child_chunk_size: Optional[int] = 200

class Chunk(BaseModel):
    id: str
    content: str
    start_index: int
    end_index: int
    word_count: int
    char_count: int
    parent_id: Optional[str] = None
    is_child: Optional[bool] = None
    children_ids: Optional[List[str]] = None

class EmbeddingRequest(BaseModel):
    chunks: List[Chunk]
    model: str = "all-MiniLM-L6-v2"
    dimensions: int = 2

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    reduced_embeddings: List[List[float]]
    similarities: List[Dict[str, Any]]
    model_info: Dict[str, Any]

class QueryRequest(BaseModel):
    query: str
    chunks: List[Chunk]
    top_k: int = 5
    similarity_metric: str = "cosine"
    rerank_method: str = "none"

class QueryResult(BaseModel):
    chunk: Chunk
    similarity: float
    rank: int
    rerank_score: Optional[float] = None
    final_rank: Optional[int] = None

class QueryResponse(BaseModel):
    query: str
    results: List[QueryResult]
    query_embedding: List[float]
    metrics: Dict[str, Any]

class PromptRequest(BaseModel):
    query: str
    retrieved_chunks: List[Chunk]
    template_id: str = "basic-qa"
    model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"

class PromptResponse(BaseModel):
    final_prompt: str
    generated_response: str
    guardrail_results: List[Dict[str, Any]]
    token_usage: Dict[str, int]
    model_info: Dict[str, Any]

# Chunking functions
def chunk_fixed_size(text: str, chunk_size: int, overlap: int) -> List[Chunk]:
    """Split text into fixed-size chunks with overlap."""
    chunks = []
    step = max(1, chunk_size - overlap)
    
    for i in range(0, len(text), step):
        end = min(i + chunk_size, len(text))
        content = text[i:end]
        
        if content.strip():
            chunks.append(Chunk(
                id=f"chunk-{len(chunks) + 1}",
                content=content,
                start_index=i,
                end_index=end,
                word_count=len(content.split()),
                char_count=len(content)
            ))
        
        if end >= len(text):
            break
    
    return chunks

def chunk_sentence_based(text: str, max_size: int, overlap: int) -> List[Chunk]:
    """Split text into chunks respecting sentence boundaries."""
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = ""
    current_start = 0
    
    for i, sentence in enumerate(sentences):
        if len(current_chunk) + len(sentence) > max_size and current_chunk:
            # Create chunk
            chunks.append(Chunk(
                id=f"chunk-{len(chunks) + 1}",
                content=current_chunk.strip(),
                start_index=current_start,
                end_index=current_start + len(current_chunk),
                word_count=len(current_chunk.split()),
                char_count=len(current_chunk)
            ))
            
            # Start new chunk with overlap
            if overlap > 0:
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_text + " " + sentence
                current_start = max(0, current_start + len(current_chunk) - overlap - len(sentence))
            else:
                current_chunk = sentence
                current_start = text.find(sentence, current_start)
        else:
            if not current_chunk:
                current_start = text.find(sentence, current_start if chunks else 0)
            current_chunk += (" " if current_chunk else "") + sentence
    
    # Add final chunk
    if current_chunk.strip():
        chunks.append(Chunk(
            id=f"chunk-{len(chunks) + 1}",
            content=current_chunk.strip(),
            start_index=current_start,
            end_index=current_start + len(current_chunk),
            word_count=len(current_chunk.split()),
            char_count=len(current_chunk)
        ))
    
    return chunks

def chunk_hierarchical(text: str, parent_size: int, child_size: int, overlap: int) -> List[Chunk]:
    """Create hierarchical parent-child chunks using LangChain."""
    try:
        # Use LangChain's RecursiveCharacterTextSplitter for parent chunks
        parent_splitter = RecursiveCharacterTextSplitter(
            chunk_size=parent_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        parent_docs = parent_splitter.create_documents([text])
        hierarchical_chunks = []
        
        for parent_idx, parent_doc in enumerate(parent_docs):
            parent_id = f"parent-{parent_idx + 1}"
            children_ids = []
            
            # Calculate start/end indices for parent
            parent_start = text.find(parent_doc.page_content)
            parent_end = parent_start + len(parent_doc.page_content)
            
            # Add parent chunk
            parent_chunk = Chunk(
                id=parent_id,
                content=parent_doc.page_content,
                start_index=parent_start,
                end_index=parent_end,
                word_count=len(parent_doc.page_content.split()),
                char_count=len(parent_doc.page_content),
                is_child=False,
                children_ids=[]
            )
            hierarchical_chunks.append(parent_chunk)
            
            # Create child chunks within parent using smaller splitter
            child_splitter = RecursiveCharacterTextSplitter(
                chunk_size=child_size,
                chunk_overlap=overlap // 2,
                separators=[". ", " ", ""]
            )
            
            child_docs = child_splitter.create_documents([parent_doc.page_content])
            
            for child_idx, child_doc in enumerate(child_docs):
                child_id = f"{parent_id}-child-{child_idx + 1}"
                children_ids.append(child_id)
                
                # Calculate relative position within parent
                child_relative_start = parent_doc.page_content.find(child_doc.page_content)
                child_start = parent_start + child_relative_start
                child_end = child_start + len(child_doc.page_content)
                
                child_chunk = Chunk(
                    id=child_id,
                    content=child_doc.page_content,
                    start_index=child_start,
                    end_index=child_end,
                    word_count=len(child_doc.page_content.split()),
                    char_count=len(child_doc.page_content),
                    parent_id=parent_id,
                    is_child=True
                )
                hierarchical_chunks.append(child_chunk)
            
            # Update parent with children IDs
            parent_chunk.children_ids = children_ids
        
        return hierarchical_chunks
    
    except Exception as e:
        # Fallback to simple implementation
        return chunk_fixed_size(text, parent_size, overlap)

def chunk_paragraph_based(text: str, max_size: int) -> List[Chunk]:
    """Split text by paragraphs."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_index = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        if len(para) <= max_size:
            chunks.append(Chunk(
                id=f"chunk-{len(chunks) + 1}",
                content=para,
                start_index=current_index,
                end_index=current_index + len(para),
                word_count=len(para.split()),
                char_count=len(para)
            ))
        else:
            # Split large paragraphs
            sub_chunks = chunk_fixed_size(para, max_size, 0)
            for sub_chunk in sub_chunks:
                chunks.append(Chunk(
                    id=f"chunk-{len(chunks) + 1}",
                    content=sub_chunk.content,
                    start_index=current_index + sub_chunk.start_index,
                    end_index=current_index + sub_chunk.end_index,
                    word_count=sub_chunk.word_count,
                    char_count=sub_chunk.char_count
                ))
        
        current_index += len(para) + 2  # Account for paragraph breaks
    
    return chunks

# LangChain-based embedding functions
def get_bedrock_embeddings(model_id: str = "amazon.titan-embed-text-v1"):
    """Get Bedrock embeddings model."""
    if not bedrock_available:
        raise HTTPException(status_code=503, detail="Bedrock not available")
    
    if model_id not in model_cache:
        try:
            model_cache[model_id] = BedrockEmbeddings(
                client=bedrock_runtime,
                model_id=model_id
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to load Bedrock model {model_id}: {str(e)}")
    
    return model_cache[model_id]

def get_bedrock_llm(model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
    """Get Bedrock LLM model."""
    if not bedrock_available:
        raise HTTPException(status_code=503, detail="Bedrock not available")
    
    try:
        return ChatBedrock(
            client=bedrock_runtime,
            model_id=model_id,
            model_kwargs={
                "max_tokens": 4000,
                "temperature": 0.1,
                "top_p": 0.9
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to initialize Bedrock LLM {model_id}: {str(e)}")

def create_langchain_documents(chunks: List[Chunk]) -> List[Document]:
    """Convert chunks to LangChain documents."""
    documents = []
    for chunk in chunks:
        doc = Document(
            page_content=chunk.content,
            metadata={
                "chunk_id": chunk.id,
                "start_index": chunk.start_index,
                "end_index": chunk.end_index,
                "word_count": chunk.word_count,
                "char_count": chunk.char_count,
                "parent_id": chunk.parent_id,
                "is_child": chunk.is_child
            }
        )
        documents.append(doc)
    return documents

def calculate_similarities(embeddings: np.ndarray, threshold: float = 0.7) -> List[Dict[str, Any]]:
    """Calculate cosine similarities between embeddings."""
    similarities = []
    
    # Normalize embeddings for cosine similarity
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized_embeddings = embeddings / norms
    
    # Calculate similarity matrix
    similarity_matrix = np.dot(normalized_embeddings, normalized_embeddings.T)
    
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            similarity = float(similarity_matrix[i, j])
            if similarity >= threshold:
                similarities.append({
                    "chunk1_index": i,
                    "chunk2_index": j,
                    "similarity": similarity
                })
    
    return similarities

# API endpoints
@app.get("/")
async def root():
    return {"message": "RAG Pipeline Educator - Python Backend"}

@app.post("/chunk", response_model=List[Chunk])
async def chunk_text(request: ChunkingRequest):
    """Chunk text using specified strategy."""
    try:
        if request.strategy == "fixed-size":
            chunks = chunk_fixed_size(request.text, request.chunk_size, request.overlap)
        elif request.strategy == "sentence":
            chunks = chunk_sentence_based(request.text, request.chunk_size, request.overlap)
        elif request.strategy == "hierarchical":
            chunks = chunk_hierarchical(
                request.text, 
                request.parent_chunk_size or 800, 
                request.child_chunk_size or 200, 
                request.overlap
            )
        elif request.strategy == "paragraph":
            chunks = chunk_paragraph_based(request.text, request.chunk_size)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown chunking strategy: {request.strategy}")
        
        return chunks
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")

@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings for chunks."""
    try:
        # Get model
        model = get_model(request.model)
        
        # Extract text content from chunks
        texts = [chunk.content for chunk in request.chunks]
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Reduce dimensions for visualization
        if request.dimensions == 2:
            if len(embeddings) > 50:
                # Use PCA first to reduce to 50 dimensions, then t-SNE
                pca = PCA(n_components=min(50, len(embeddings) - 1))
                embeddings_pca = pca.fit_transform(embeddings)
                tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(embeddings) - 1))
                reduced_embeddings = tsne.fit_transform(embeddings_pca)
            else:
                tsne = TSNE(n_components=2, random_state=42, perplexity=min(5, len(embeddings) - 1))
                reduced_embeddings = tsne.fit_transform(embeddings)
        elif request.dimensions == 3:
            if len(embeddings) > 50:
                pca = PCA(n_components=min(50, len(embeddings) - 1))
                embeddings_pca = pca.fit_transform(embeddings)
                tsne = TSNE(n_components=3, random_state=42, perplexity=min(30, len(embeddings) - 1))
                reduced_embeddings = tsne.fit_transform(embeddings_pca)
            else:
                tsne = TSNE(n_components=3, random_state=42, perplexity=min(5, len(embeddings) - 1))
                reduced_embeddings = tsne.fit_transform(embeddings)
        else:
            # Use PCA for other dimensions
            pca = PCA(n_components=min(request.dimensions, len(embeddings) - 1))
            reduced_embeddings = pca.fit_transform(embeddings)
        
        # Calculate similarities
        similarities = calculate_similarities(embeddings)
        
        # Model info
        model_info = {
            "name": request.model,
            "dimensions": embeddings.shape[1],
            "num_chunks": len(request.chunks)
        }
        
        return EmbeddingResponse(
            embeddings=embeddings.tolist(),
            reduced_embeddings=reduced_embeddings.tolist(),
            similarities=similarities,
            model_info=model_info
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_chunks(request: QueryRequest):
    """Query chunks using vector similarity search."""
    try:
        # Get embedding model
        if bedrock_available:
            embeddings_model = get_bedrock_embeddings("amazon.titan-embed-text-v1")
        else:
            raise HTTPException(status_code=503, detail="Bedrock not available")
        
        # Create documents from chunks
        documents = create_langchain_documents(request.chunks)
        
        # Create vector store
        vectorstore = FAISS.from_documents(documents, embeddings_model)
        
        # Generate query embedding
        query_embedding = embeddings_model.embed_query(request.query)
        
        # Perform similarity search
        similar_docs = vectorstore.similarity_search_with_score(
            request.query, 
            k=request.top_k
        )
        
        # Process results
        results = []
        for idx, (doc, score) in enumerate(similar_docs):
            # Find original chunk
            chunk_id = doc.metadata["chunk_id"]
            original_chunk = next(c for c in request.chunks if c.id == chunk_id)
            
            # Convert distance to similarity (FAISS returns L2 distance)
            similarity = 1 / (1 + score) if request.similarity_metric == "euclidean" else score
            
            result = QueryResult(
                chunk=original_chunk,
                similarity=float(similarity),
                rank=idx + 1,
                final_rank=idx + 1
            )
            results.append(result)
        
        # Apply reranking if specified
        if request.rerank_method != "none":
            results = await apply_reranking(request.query, results, request.rerank_method)
        
        # Calculate metrics
        metrics = {
            "total_chunks": len(request.chunks),
            "retrieved_chunks": len(results),
            "avg_similarity": sum(r.similarity for r in results) / len(results) if results else 0,
            "similarity_metric": request.similarity_metric,
            "rerank_method": request.rerank_method
        }
        
        return QueryResponse(
            query=request.query,
            results=results,
            query_embedding=query_embedding,
            metrics=metrics
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

async def apply_reranking(query: str, results: List[QueryResult], method: str) -> List[QueryResult]:
    """Apply reranking to query results."""
    if method == "cross-encoder":
        # Simulate cross-encoder reranking
        for result in results:
            # Simple heuristic: boost results with query keywords
            query_words = set(query.lower().split())
            content_words = set(result.chunk.content.lower().split())
            keyword_overlap = len(query_words.intersection(content_words)) / len(query_words)
            result.rerank_score = result.similarity * (0.7 + keyword_overlap * 0.3)
    
    elif method == "bm25":
        # Simulate BM25 hybrid scoring
        for result in results:
            # Simple keyword matching boost
            query_words = query.lower().split()
            keyword_boost = sum(1 for word in query_words if word in result.chunk.content.lower())
            result.rerank_score = result.similarity + (keyword_boost * 0.1)
    
    elif method == "llm-rerank":
        # Use LLM for reranking (simplified)
        try:
            llm = get_bedrock_llm()
            for result in results:
                # Simple relevance scoring
                prompt = f"Rate the relevance of this text to the query '{query}' on a scale of 0-1:\n\n{result.chunk.content[:200]}..."
                # For demo purposes, use a simple heuristic
                result.rerank_score = result.similarity * (0.8 + np.random.random() * 0.4)
        except:
            # Fallback to simple reranking
            for result in results:
                result.rerank_score = result.similarity * (0.8 + np.random.random() * 0.4)
    
    # Re-sort by rerank score if available
    if method != "none":
        results.sort(key=lambda x: x.rerank_score or 0, reverse=True)
        for idx, result in enumerate(results):
            result.final_rank = idx + 1
    
    return results

@app.post("/generate", response_model=PromptResponse)
async def generate_response(request: PromptRequest):
    """Generate response using retrieved chunks and LLM."""
    try:
        # Get LLM
        llm = get_bedrock_llm(request.model_id)
        
        # Create context from retrieved chunks
        context = "\n\n".join([
            f"[{idx + 1}] {chunk.content}" 
            for idx, chunk in enumerate(request.retrieved_chunks)
        ])
        
        # Define prompt templates
        templates = {
            "basic-qa": """Answer the following question based on the provided context.

Context:
{context}

Question: {query}

Answer:""",
            "conversational": """You are a helpful AI assistant. Use the following context to answer the user's question in a conversational and friendly manner.

Context:
{context}

User: {query}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)As
sistant: I'll help you with that. Let me provide a comprehensive answer based on the information available.""",
            "analytical": """Analyze the following context and provide a detailed answer to the question.

Context Information:
{context}

Question: {query}

Please provide:
1. A direct answer
2. Supporting evidence from the context
3. Any limitations or uncertainties

Analysis:"""
        }
        
        # Get template
        template = templates.get(request.template_id, templates["basic-qa"])
        
        # Create final prompt
        final_prompt = template.format(context=context, query=request.query)
        
        # Run guardrails
        guardrail_results = run_guardrails(request.query, request.retrieved_chunks, final_prompt)
        
        # Generate response
        try:
            response = llm.invoke(final_prompt)
            generated_response = response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            generated_response = f"Error generating response: {str(e)}"
        
        # Calculate token usage (approximate)
        token_usage = {
            "prompt_tokens": len(final_prompt.split()) * 1.3,  # Rough estimate
            "completion_tokens": len(generated_response.split()) * 1.3,
            "total_tokens": len(final_prompt.split()) * 1.3 + len(generated_response.split()) * 1.3
        }
        
        # Model info
        model_info = {
            "model_id": request.model_id,
            "template_id": request.template_id,
            "context_chunks": len(request.retrieved_chunks)
        }
        
        return PromptResponse(
            final_prompt=final_prompt,
            generated_response=generated_response,
            guardrail_results=guardrail_results,
            token_usage=token_usage,
            model_info=model_info
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

def run_guardrails(query: str, chunks: List[Chunk], prompt: str) -> List[Dict[str, Any]]:
    """Run guardrail checks on the prompt."""
    results = []
    
    # Context relevance check
    query_words = set(query.lower().split())
    relevant_chunks = 0
    for chunk in chunks:
        chunk_words = set(chunk.content.lower().split())
        if query_words.intersection(chunk_words):
            relevant_chunks += 1
    
    relevance_ratio = relevant_chunks / len(chunks) if chunks else 0
    
    if relevance_ratio >= 0.7:
        status = "pass"
        message = f"{int(relevance_ratio * 100)}% of context is relevant"
    elif relevance_ratio >= 0.4:
        status = "warning"
        message = f"Only {int(relevance_ratio * 100)}% of context is relevant"
    else:
        status = "fail"
        message = f"Low relevance: {int(relevance_ratio * 100)}%"
    
    results.append({
        "id": "context-relevance",
        "name": "Context Relevance",
        "status": status,
        "message": message,
        "severity": "high"
    })
    
    # Token length check
    estimated_tokens = len(prompt.split()) * 1.3
    
    if estimated_tokens <= 2000:
        status = "pass"
        message = f"{int(estimated_tokens)} tokens (within limits)"
    elif estimated_tokens <= 4000:
        status = "warning"
        message = f"{int(estimated_tokens)} tokens (approaching limit)"
    else:
        status = "fail"
        message = f"{int(estimated_tokens)} tokens (exceeds limit)"
    
    results.append({
        "id": "token-length",
        "name": "Token Length",
        "status": status,
        "message": message,
        "severity": "high"
    })
    
    return results

@app.get("/models")
async def get_available_models():
    """Get list of available models."""
    models = {
        "embedding_models": [
            {
                "id": "amazon.titan-embed-text-v1",
                "name": "Amazon Titan Text Embeddings v1",
                "dimensions": 1536,
                "description": "High-quality embeddings for text similarity and search",
                "provider": "Amazon"
            },
            {
                "id": "cohere.embed-english-v3",
                "name": "Cohere Embed English v3",
                "dimensions": 1024,
                "description": "Optimized for English text embeddings",
                "provider": "Cohere"
            },
            {
                "id": "cohere.embed-multilingual-v3",
                "name": "Cohere Embed Multilingual v3",
                "dimensions": 1024,
                "description": "Supports multiple languages",
                "provider": "Cohere"
            }
        ],
        "llm_models": [
            {
                "id": "anthropic.claude-3-sonnet-20240229-v1:0",
                "name": "Claude 3 Sonnet",
                "description": "Balanced performance and speed",
                "provider": "Anthropic",
                "max_tokens": 4096
            },
            {
                "id": "anthropic.claude-3-haiku-20240307-v1:0",
                "name": "Claude 3 Haiku",
                "description": "Fast and efficient",
                "provider": "Anthropic",
                "max_tokens": 4096
            },
            {
                "id": "amazon.titan-text-premier-v1:0",
                "name": "Amazon Titan Text Premier",
                "description": "High-quality text generation",
                "provider": "Amazon",
                "max_tokens": 4096
            }
        ]
    }
    
    if not bedrock_available:
        models["warning"] = "Bedrock not available - using fallback models"
    
    return models

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "bedrock_available": bedrock_available,
        "services": {
            "chunking": "available",
            "embeddings": "available" if bedrock_available else "limited",
            "querying": "available" if bedrock_available else "limited",
            "generation": "available" if bedrock_available else "unavailable"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)