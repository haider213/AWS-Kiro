from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import re
import json
import uuid
from datetime import datetime
import logging
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from dotenv import load_dotenv

# LangChain imports
from langchain_experimental.text_splitter import SemanticChunker
from langchain_core.embeddings import Embeddings
from typing import List

# Load environment variables
load_dotenv()

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Bedrock Configuration
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
BEDROCK_REGION = os.getenv('BEDROCK_REGION', 'us-east-1')

# Initialize Bedrock client
try:
    bedrock_runtime = boto3.client(
        'bedrock-runtime',
        region_name=BEDROCK_REGION,
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    bedrock_available = True
    logger.info("Bedrock client initialized successfully")
except (NoCredentialsError, Exception) as e:
    bedrock_runtime = None
    bedrock_available = False
    logger.warning(f"Bedrock not available: {e}")

# Bedrock model configurations
BEDROCK_MODELS = {
    'embedding': {
        'amazon.titan-embed-text-v1': {
            'name': 'Amazon Titan Text Embeddings v1',
            'dimensions': 1536,
            'max_input_tokens': 8192
        },
        'amazon.titan-embed-text-v2:0': {
            'name': 'Amazon Titan Text Embeddings v2',
            'dimensions': 1024,
            'max_input_tokens': 8192
        },
        'cohere.embed-english-v3': {
            'name': 'Cohere Embed English v3',
            'dimensions': 1024,
            'max_input_tokens': 512
        }
    },
    'generation': {
        'anthropic.claude-3-haiku-20240307-v1:0': {
            'name': 'Claude 3 Haiku',
            'max_tokens': 4096,
            'context_window': 200000
        },
        'anthropic.claude-3-sonnet-20240229-v1:0': {
            'name': 'Claude 3 Sonnet',
            'max_tokens': 4096,
            'context_window': 200000
        },
        'amazon.titan-text-premier-v1:0': {
            'name': 'Amazon Titan Text Premier',
            'max_tokens': 3000,
            'context_window': 32000
        }
    }
}

class BedrockEmbeddings(Embeddings):
    """Custom embeddings class for Bedrock integration with LangChain"""
    
    def __init__(self, model_id: str = 'amazon.titan-embed-text-v1'):
        self.model_id = model_id
        self.bedrock_service = None
        
    def set_bedrock_service(self, bedrock_service):
        """Set the bedrock service instance"""
        self.bedrock_service = bedrock_service
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents"""
        if not self.bedrock_service:
            raise ValueError("Bedrock service not initialized")
        
        try:
            return self.bedrock_service.get_bedrock_embeddings_batch(texts, self.model_id)
        except Exception as e:
            logger.error(f"Failed to embed documents: {e}")
            # Return zero vectors as fallback
            dimensions = BEDROCK_MODELS['embedding'][self.model_id]['dimensions']
            return [[0.0] * dimensions for _ in texts]
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query"""
        if not self.bedrock_service:
            raise ValueError("Bedrock service not initialized")
        
        try:
            return self.bedrock_service.get_bedrock_embedding(text, self.model_id)
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            # Return zero vector as fallback
            dimensions = BEDROCK_MODELS['embedding'][self.model_id]['dimensions']
            return [0.0] * dimensions

class BedrockService:
    """Service class for AWS Bedrock operations"""
    
    @staticmethod
    def get_bedrock_embedding(text, model_id='amazon.titan-embed-text-v1'):
        """Generate embeddings using Bedrock"""
        if not bedrock_available:
            raise Exception("Bedrock is not available. Please configure AWS credentials.")
        
        try:
            # Prepare the request body based on model
            if model_id.startswith('amazon.titan-embed'):
                body = json.dumps({
                    "inputText": text
                })
            elif model_id.startswith('cohere.embed'):
                body = json.dumps({
                    "texts": [text],
                    "input_type": "search_document"
                })
            else:
                raise ValueError(f"Unsupported embedding model: {model_id}")
            
            # Call Bedrock
            response = bedrock_runtime.invoke_model(
                modelId=model_id,
                body=body,
                contentType='application/json',
                accept='application/json'
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            if model_id.startswith('amazon.titan-embed'):
                return response_body['embedding']
            elif model_id.startswith('cohere.embed'):
                return response_body['embeddings'][0]
            
        except ClientError as e:
            logger.error(f"Bedrock embedding error: {e}")
            raise Exception(f"Bedrock embedding failed: {e}")
    
    @staticmethod
    def get_bedrock_embeddings_batch(texts, model_id='amazon.titan-embed-text-v1', batch_size=25):
        """Generate embeddings for multiple texts"""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = []
            
            for text in batch:
                try:
                    embedding = BedrockService.get_bedrock_embedding(text, model_id)
                    batch_embeddings.append(embedding)
                except Exception as e:
                    logger.error(f"Failed to get embedding for text: {e}")
                    # Use zero vector as fallback
                    dimensions = BEDROCK_MODELS['embedding'][model_id]['dimensions']
                    batch_embeddings.append([0.0] * dimensions)
            
            embeddings.extend(batch_embeddings)
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
        
        return embeddings
    
    @staticmethod
    def generate_text_bedrock(prompt, model_id='anthropic.claude-3-haiku-20240307-v1:0', **kwargs):
        """Generate text using Bedrock"""
        if not bedrock_available:
            raise Exception("Bedrock is not available. Please configure AWS credentials.")
        
        try:
            # Prepare request body based on model
            if model_id.startswith('anthropic.claude'):
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": kwargs.get('max_tokens', 1000),
                    "temperature": kwargs.get('temperature', 0.7),
                    "top_p": kwargs.get('top_p', 0.9),
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            elif model_id.startswith('amazon.titan'):
                body = json.dumps({
                    "inputText": prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": kwargs.get('max_tokens', 1000),
                        "temperature": kwargs.get('temperature', 0.7),
                        "topP": kwargs.get('top_p', 0.9)
                    }
                })
            else:
                raise ValueError(f"Unsupported generation model: {model_id}")
            
            # Call Bedrock
            response = bedrock_runtime.invoke_model(
                modelId=model_id,
                body=body,
                contentType='application/json',
                accept='application/json'
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            if model_id.startswith('anthropic.claude'):
                return response_body['content'][0]['text']
            elif model_id.startswith('amazon.titan'):
                return response_body['results'][0]['outputText']
                
        except ClientError as e:
            logger.error(f"Bedrock generation error: {e}")
            raise Exception(f"Bedrock generation failed: {e}")

class DocumentProcessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.chunks = []
        self.embeddings = None
        self.tsne_coords = None
        self.bedrock_service = BedrockService()
        
    def clean_text(self, text):
        """Clean and preprocess text"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove special characters but keep punctuation for sentence boundaries
        text = re.sub(r'[^\w\s\.\!\?\,\;\:]', '', text)
        return text
    

    
    def chunk_by_sentences(self, text):
        """Simple sentence-based chunking using NLTK sent_tokenize"""
        sentences = sent_tokenize(text)
        logger.info(f"Sentence tokenization: {len(sentences)} sentences found")
        chunks = []
        
        for i, sentence in enumerate(sentences):
            if sentence.strip():
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'content': sentence.strip(),
                    'sentence_index': i,
                    'word_count': len(word_tokenize(sentence)),
                    'char_count': len(sentence.strip()),
                    'strategy': 'sentence_based'
                })
        
        logger.info(f"Created {len(chunks)} sentence-based chunks")
        return chunks

    def chunk_by_fixed_size(self, text, chunk_size=500, overlap=50):
        """Chunk text by fixed character size with overlap"""
        chunks = []
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            
            # Try to break at word boundary
            if end < len(text):
                last_space = chunk_text.rfind(' ')
                if last_space > chunk_size * 0.8:  # Only if we don't lose too much
                    end = start + last_space
                    chunk_text = text[start:end]
            
            if chunk_text.strip():
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'content': chunk_text.strip(),
                    'start_char': start,
                    'end_char': end,
                    'word_count': len(word_tokenize(chunk_text)),
                    'char_count': len(chunk_text.strip()),
                    'strategy': 'fixed_size'
                })
            
            start = end - overlap
            chunk_id += 1
            
            if start >= len(text):
                break
        
        return chunks
    
    def chunk_by_paragraphs(self, text):
        """Chunk text by paragraphs"""
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        chunks = []
        
        for i, paragraph in enumerate(paragraphs):
            if paragraph:
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'content': paragraph,
                    'paragraph_index': i,
                    'word_count': len(word_tokenize(paragraph)),
                    'char_count': len(paragraph),
                    'strategy': 'paragraph_based'
                })
        
        return chunks
    
    def chunk_by_semantic(self, text, similarity_threshold=0.5, embedding_method='bedrock', embedding_model='amazon.titan-embed-text-v1'):
        """Chunk text by semantic similarity using LangChain's SemanticChunker"""
        try:
            # Choose embeddings based on method
            if embedding_method == 'bedrock' and bedrock_available:
                logger.info(f"Using Bedrock embeddings for semantic chunking: {embedding_model}")
                embeddings = BedrockEmbeddings(model_id=embedding_model)
                embeddings.set_bedrock_service(self.bedrock_service)
                
                # Configure SemanticChunker with Bedrock embeddings
                semantic_chunker = SemanticChunker(
                    embeddings=embeddings,
                    buffer_size=1,  # Number of sentences to group together
                    breakpoint_threshold_type='percentile',
                    breakpoint_threshold_amount=similarity_threshold * 100,  # Convert to percentile
                    min_chunk_size=50  # Minimum chunk size in characters
                )
                
                try:
                    # Use LangChain's semantic chunker
                    chunk_texts = semantic_chunker.split_text(text)
                    logger.info(f"SemanticChunker created {len(chunk_texts)} chunks")
                    
                except Exception as e:
                    logger.error(f"LangChain SemanticChunker failed: {e}")
                    return []
                    
            else:
                logger.error("Semantic chunking requires Bedrock embeddings. TF-IDF is no longer supported.")
                return []
            
            # Convert LangChain chunks to our format
            chunks = []
            for i, chunk_text in enumerate(chunk_texts):
                if chunk_text.strip():
                    chunks.append({
                        'id': str(uuid.uuid4()),
                        'content': chunk_text.strip(),
                        'chunk_index': i,
                        'word_count': len(word_tokenize(chunk_text)),
                        'char_count': len(chunk_text.strip()),
                        'strategy': 'semantic_based',
                        'embedding_method': embedding_method,
                        'embedding_model': embedding_model
                    })
            
            logger.info(f"Successfully created {len(chunks)} semantic chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Semantic chunking failed: {e}")
            return []
    
    def generate_embeddings(self, chunks, method='tfidf', model_id='amazon.titan-embed-text-v1'):
        """Generate embeddings for chunks using specified method"""
        if not chunks:
            return None
        
        texts = [chunk['content'] for chunk in chunks]
        
        if method == 'bedrock' and bedrock_available:
            logger.info(f"Generating Bedrock embeddings using {model_id}")
            try:
                logger.info(f"Attempting to get Bedrock embeddings for {len(texts)} texts")
                # Get Bedrock embeddings
                embeddings_list = self.bedrock_service.get_bedrock_embeddings_batch(texts, model_id)
                logger.info(f"Received {len(embeddings_list)} embeddings from Bedrock")
                
                if not embeddings_list or not embeddings_list[0]:
                    raise Exception("Empty embeddings received from Bedrock")
                
                embeddings_dense = np.array(embeddings_list)
                feature_names = [f"bedrock_dim_{i}" for i in range(embeddings_dense.shape[1])]
                logger.info(f"Bedrock embeddings shape: {embeddings_dense.shape}")
                
            except Exception as e:
                logger.error(f"Bedrock embedding failed, falling back to TF-IDF: {e}")
                logger.error(f"Error details: {type(e).__name__}: {str(e)}")
                method = 'tfidf'
        
        if method == 'tfidf':
            logger.error("TF-IDF embeddings are no longer supported. Please use Bedrock embeddings.")
            return None
        
        # Generate t-SNE coordinates for visualization
        if len(chunks) > 1:
            tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(chunks)-1))
            tsne_coords = tsne.fit_transform(embeddings_dense)
        else:
            tsne_coords = np.array([[0, 0]])
        
        return {
            'embeddings': embeddings_dense.tolist(),
            'tsne_coordinates': tsne_coords.tolist(),
            'feature_names': feature_names,
            'method': method,
            'model_id': model_id if method == 'bedrock' else 'tfidf',
            'dimensions': embeddings_dense.shape[1]
        }
    
    def calculate_similarities(self, chunks, embeddings):
        """Calculate similarity matrix between chunks"""
        if not embeddings or len(chunks) < 2:
            return []
        
        embeddings_array = np.array(embeddings['embeddings'])
        similarity_matrix = cosine_similarity(embeddings_array)
        
        similarities = []
        for i in range(len(chunks)):
            for j in range(i + 1, len(chunks)):
                similarities.append({
                    'chunk1_id': chunks[i]['id'],
                    'chunk2_id': chunks[j]['id'],
                    'similarity': float(similarity_matrix[i][j]),
                    'chunk1_preview': chunks[i]['content'][:100] + '...',
                    'chunk2_preview': chunks[j]['content'][:100] + '...'
                })
        
        return sorted(similarities, key=lambda x: x['similarity'], reverse=True)

# Global processor instance
processor = DocumentProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/test', methods=['POST'])
def test_endpoint():
    """Test endpoint for debugging request parsing"""
    try:
        logger.info(f"Test endpoint - Content-Type: {request.content_type}")
        logger.info(f"Test endpoint - Raw data: {request.get_data()}")
        
        data = request.get_json()
        logger.info(f"Test endpoint - Parsed JSON: {data}")
        
        return jsonify({
            'success': True,
            'received_data': data,
            'content_type': request.content_type
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-document', methods=['POST'])
def process_document():
    try:
        logger.info(f"Received request: {request.method} {request.path}")
        logger.info(f"Content-Type: {request.content_type}")
        
        data = request.get_json()
        logger.info(f"Parsed JSON data: {data}")
        
        if not data:
            logger.error("No JSON data provided")
            return jsonify({'error': 'No JSON data provided'}), 400
            
        text = data.get('text', '')
        strategy = data.get('strategy', 'sentence_based')
        
        logger.info(f"Processing with strategy: {strategy}, text length: {len(text)}")
        
        # Strategy-specific parameters
        chunk_size = data.get('chunk_size', 500)
        overlap = data.get('overlap', 50)
        sentences_per_chunk = data.get('sentences_per_chunk', 3)
        similarity_threshold = data.get('similarity_threshold', 0.5)
        
        # Embedding parameters
        embedding_method = data.get('embedding_method', 'tfidf')  # 'tfidf' or 'bedrock'
        embedding_model = data.get('embedding_model', 'amazon.titan-embed-text-v1')
        
        if not text.strip():
            return jsonify({'error': 'Text is required'}), 400
        
        # Clean the text
        cleaned_text = processor.clean_text(text)
        
        # Apply chunking strategy
        if strategy == 'sentence_based':
            chunks = processor.chunk_by_sentences(cleaned_text)
        elif strategy == 'fixed_size':
            chunks = processor.chunk_by_fixed_size(
                cleaned_text,
                chunk_size=chunk_size,
                overlap=overlap
            )
        elif strategy == 'paragraph_based':
            chunks = processor.chunk_by_paragraphs(cleaned_text)
        elif strategy == 'semantic_based':
            chunks = processor.chunk_by_semantic(
                cleaned_text,
                similarity_threshold=similarity_threshold,
                embedding_method=embedding_method,
                embedding_model=embedding_model
            )
        else:
            return jsonify({'error': 'Invalid chunking strategy'}), 400
        
        # Generate embeddings and visualizations
        embeddings_data = processor.generate_embeddings(
            chunks, 
            method=embedding_method, 
            model_id=embedding_model
        )
        
        # Handle case where embeddings generation fails
        if embeddings_data is None:
            logger.warning("Embeddings generation failed, creating empty embeddings data")
            embeddings_data = {
                'embeddings': [],
                'tsne_coordinates': [],
                'feature_names': [],
                'method': 'failed',
                'model_id': 'none',
                'dimensions': 0
            }
        
        similarities = processor.calculate_similarities(chunks, embeddings_data)
        
        # Store for later use
        processor.chunks = chunks
        processor.embeddings = embeddings_data
        
        # Calculate statistics
        stats = {
            'total_chunks': len(chunks),
            'avg_chunk_size': np.mean([chunk['char_count'] for chunk in chunks]) if chunks else 0,
            'avg_word_count': np.mean([chunk['word_count'] for chunk in chunks]) if chunks else 0,
            'strategy_used': strategy,
            'embedding_method': embeddings_data.get('method', 'unknown') if embeddings_data else 'none',
            'embedding_model': embeddings_data.get('model_id', 'unknown') if embeddings_data else 'none',
            'embedding_dimensions': embeddings_data.get('dimensions', 0) if embeddings_data else 0,
            'total_characters': len(cleaned_text),
            'total_words': len(word_tokenize(cleaned_text)),
            'bedrock_available': bedrock_available
        }
        
        return jsonify({
            'success': True,
            'chunks': chunks,
            'embeddings': embeddings_data,
            'similarities': similarities[:20],  # Top 20 most similar pairs
            'statistics': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return jsonify({'error': str(e)}), 500

def apply_reranking(results, query, method):
    """Apply different reranking methods to initial search results"""
    try:
        if method == 'bm25':
            return rerank_bm25(results, query)
        elif method == 'cross_encoder':
            return rerank_cross_encoder(results, query)
        elif method == 'diversity':
            return rerank_diversity(results)
        elif method == 'length_penalty':
            return rerank_length_penalty(results)
        elif method == 'keyword_boost':
            return rerank_keyword_boost(results, query)
        else:
            return results
    except Exception as e:
        logger.error(f"Reranking failed with method {method}: {e}")
        return results  # Return original results if reranking fails

def rerank_bm25(results, query):
    """BM25-based reranking using keyword matching"""
    query_terms = query.lower().split()
    
    for result in results:
        content = result['content'].lower()
        bm25_score = 0
        
        for term in query_terms:
            tf = content.count(term)
            if tf > 0:
                # Simplified BM25 calculation
                k1, b = 1.5, 0.75
                doc_len = len(content.split())
                avg_doc_len = np.mean([len(r['content'].split()) for r in results])
                
                idf = np.log((len(results) + 1) / (sum(1 for r in results if term in r['content'].lower()) + 1))
                bm25_score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / avg_doc_len)))
        
        # Combine with original similarity score
        result['bm25_score'] = float(bm25_score)
        result['combined_score'] = float(0.7 * result['similarity_score'] + 0.3 * (bm25_score / max(1, max(r.get('bm25_score', 0) for r in results))))
    
    return sorted(results, key=lambda x: x['combined_score'], reverse=True)

def rerank_cross_encoder(results, query):
    """Simulated cross-encoder reranking (would use actual model in production)"""
    # This is a simplified simulation - in production you'd use a real cross-encoder model
    for result in results:
        content = result['content']
        
        # Simulate cross-encoder score based on query-document interaction
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        # Calculate overlap and position-based scoring
        overlap = len(query_words.intersection(content_words))
        total_words = len(query_words.union(content_words))
        
        # Simulate attention-based scoring
        cross_encoder_score = overlap / max(1, total_words)
        
        # Add position bias (earlier mentions are more important)
        for word in query_words:
            if word in content.lower():
                position = content.lower().find(word)
                position_weight = 1 / (1 + position / len(content))
                cross_encoder_score += position_weight * 0.1
        
        result['cross_encoder_score'] = float(cross_encoder_score)
        result['combined_score'] = float(0.6 * result['similarity_score'] + 0.4 * cross_encoder_score)
    
    return sorted(results, key=lambda x: x['combined_score'], reverse=True)

def rerank_diversity(results):
    """Diversity-based reranking to avoid redundant results"""
    if len(results) <= 1:
        return results
    
    reranked = [results[0]]  # Start with top result
    remaining = results[1:]
    
    while remaining and len(reranked) < len(results):
        best_candidate = None
        best_score = -1
        
        for candidate in remaining:
            # Calculate diversity score (average distance from already selected)
            diversity_score = 0
            for selected in reranked:
                # Simple diversity based on content overlap
                candidate_words = set(candidate['content'].lower().split())
                selected_words = set(selected['content'].lower().split())
                
                overlap = len(candidate_words.intersection(selected_words))
                total = len(candidate_words.union(selected_words))
                diversity = 1 - (overlap / max(1, total))
                diversity_score += diversity
            
            diversity_score /= len(reranked)
            
            # Combine original similarity with diversity
            combined_score = 0.7 * candidate['similarity_score'] + 0.3 * diversity_score
            
            if combined_score > best_score:
                best_score = combined_score
                best_candidate = candidate
        
        if best_candidate:
            best_candidate['diversity_score'] = float(best_score)
            reranked.append(best_candidate)
            remaining.remove(best_candidate)
    
    return reranked

def rerank_length_penalty(results):
    """Apply length penalty to prefer chunks of optimal length"""
    optimal_length = 150  # Optimal word count for chunks
    
    for result in results:
        word_count = result['word_count']
        
        # Calculate length penalty (closer to optimal = higher score)
        if word_count <= optimal_length:
            length_score = word_count / optimal_length
        else:
            length_score = optimal_length / word_count
        
        result['length_score'] = float(length_score)
        result['combined_score'] = float(0.8 * result['similarity_score'] + 0.2 * length_score)
    
    return sorted(results, key=lambda x: x['combined_score'], reverse=True)

def rerank_keyword_boost(results, query):
    """Boost results that contain exact keyword matches"""
    query_keywords = query.lower().split()
    
    for result in results:
        content = result['content'].lower()
        keyword_score = 0
        
        for keyword in query_keywords:
            if keyword in content:
                # Count exact matches
                exact_matches = content.count(keyword)
                keyword_score += exact_matches * 0.1
                
                # Boost if keyword appears in first sentence
                first_sentence = content.split('.')[0] if '.' in content else content
                if keyword in first_sentence:
                    keyword_score += 0.2
        
        result['keyword_score'] = float(keyword_score)
        result['combined_score'] = float(0.75 * result['similarity_score'] + 0.25 * min(1.0, keyword_score))
    
    return sorted(results, key=lambda x: x['combined_score'], reverse=True)

@app.route('/api/search-chunks', methods=['POST'])
def search_chunks():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        query = data.get('query', '')
        top_k = data.get('top_k', 5)
        similarity_metric = data.get('similarity_metric', 'cosine')
        reranking_method = data.get('reranking_method', 'none')
        
        logger.info(f"Search request - Query: '{query}', Top-K: {top_k}, Metric: {similarity_metric}, Reranking: {reranking_method}")
        
        if not query.strip():
            logger.error("Empty query provided")
            return jsonify({'error': 'Query is required'}), 400
        
        if not processor.chunks:
            logger.error("No chunks available - document not processed")
            return jsonify({
                'error': 'No document processed yet',
                'message': 'Please go to Phase 1 (Document Chunking) and process a document first before searching.',
                'step': 'process_document_first'
            }), 400
            
        if not processor.embeddings:
            logger.error("No embeddings available")
            return jsonify({
                'error': 'No embeddings available',
                'message': 'Please go to Phase 2 (Vector Embeddings) and generate embeddings first before searching.',
                'step': 'generate_embeddings_first'
            }), 400
            
        logger.info(f"Available chunks: {len(processor.chunks)}, Embeddings method: {processor.embeddings.get('method', 'unknown')}")
        
        # Generate query embedding using Bedrock (only method supported now)
        if processor.embeddings['method'] == 'bedrock':
            # For Bedrock embeddings, we need to generate a new embedding for the query
            try:
                query_embedding = BedrockService.get_bedrock_embedding(
                    query, 
                    processor.embeddings['model_id']
                )
                logger.info(f"Generated query embedding for: '{query}'")
            except Exception as e:
                logger.error(f"Bedrock query embedding failed: {e}")
                return jsonify({'error': f'Failed to generate query embedding: {str(e)}'}), 500
        else:
            logger.error(f"Unsupported embedding method: {processor.embeddings['method']}")
            return jsonify({'error': 'Only Bedrock embeddings are supported for search'}), 400
        
        # Calculate similarities with all chunks using specified metric
        chunk_embeddings = np.array(processor.embeddings['embeddings'])
        
        if similarity_metric == 'cosine':
            similarities = cosine_similarity([query_embedding], chunk_embeddings)[0]
        elif similarity_metric == 'euclidean':
            # Convert to similarity (inverse of distance)
            distances = np.linalg.norm(chunk_embeddings - query_embedding, axis=1)
            similarities = 1 / (1 + distances)  # Convert distance to similarity
        elif similarity_metric == 'dot_product':
            similarities = np.dot(chunk_embeddings, query_embedding)
        else:
            similarities = cosine_similarity([query_embedding], chunk_embeddings)[0]
        
        # Get initial top-k results (more than needed for reranking)
        initial_k = min(top_k * 3, len(processor.chunks))  # Get 3x more for reranking
        top_indices = np.argsort(similarities)[::-1][:initial_k]
        
        # Create initial results
        initial_results = []
        for idx in top_indices:
            chunk = processor.chunks[idx]
            initial_results.append({
                **chunk,
                'similarity_score': float(similarities[idx]),
                'initial_rank': len(initial_results) + 1,
                'chunk_index': idx
            })
        
        # Apply reranking if specified
        if reranking_method != 'none' and len(initial_results) > 1:
            reranked_results = apply_reranking(initial_results, query, reranking_method)
            results = reranked_results[:top_k]  # Take final top-k after reranking
        else:
            results = initial_results[:top_k]
        
        # Add final ranks and ensure JSON serializable types
        for i, result in enumerate(results):
            result['rank'] = int(i + 1)
            # Convert numpy types to Python native types
            if 'similarity_score' in result:
                result['similarity_score'] = float(result['similarity_score'])
            if 'word_count' in result:
                result['word_count'] = int(result['word_count'])
            if 'char_count' in result:
                result['char_count'] = int(result['char_count'])
            if 'chunk_index' in result:
                result['chunk_index'] = int(result['chunk_index'])
            if 'initial_rank' in result:
                result['initial_rank'] = int(result['initial_rank'])
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'total_chunks_searched': len(processor.chunks),
            'similarity_metric': similarity_metric,
            'reranking_method': reranking_method,
            'initial_candidates': initial_k,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error searching chunks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chunk-strategies', methods=['GET'])
def get_chunk_strategies():
    """Get available chunking strategies and their parameters"""
    strategies = {
        'sentence_based': {
            'name': 'Sentence-Based Chunking',
            'description': 'Each sentence becomes a separate chunk using NLTK tokenization',
            'parameters': {},
            'pros': ['Preserves sentence boundaries', 'Simple and reliable', 'Natural language units'],
            'cons': ['Variable chunk sizes', 'May create very small chunks']
        },
        'fixed_size': {
            'name': 'Fixed-Size Chunking',
            'description': 'Creates chunks of consistent character length',
            'parameters': {
                'chunk_size': {'type': 'int', 'default': 500, 'min': 100, 'max': 2000},
                'overlap': {'type': 'int', 'default': 50, 'min': 0, 'max': 200}
            },
            'pros': ['Consistent chunk sizes', 'Predictable memory usage', 'Simple implementation'],
            'cons': ['May break sentences', 'Ignores semantic boundaries']
        },
        'paragraph_based': {
            'name': 'Paragraph-Based Chunking',
            'description': 'Uses natural paragraph breaks as chunk boundaries',
            'parameters': {},
            'pros': ['Preserves document structure', 'Semantic coherence', 'Natural boundaries'],
            'cons': ['Variable chunk sizes', 'Depends on document formatting']
        },
        'semantic_based': {
            'name': 'Semantic-Based Chunking',
            'description': 'Groups semantically similar sentences together',
            'parameters': {
                'similarity_threshold': {'type': 'float', 'default': 0.5, 'min': 0.1, 'max': 0.9}
            },
            'pros': ['Semantic coherence', 'Context preservation', 'Intelligent boundaries'],
            'cons': ['Computationally expensive', 'Variable chunk sizes', 'Complex implementation']
        }
    }
    
    return jsonify({
        'success': True,
        'strategies': strategies
    })

@app.route('/api/embedding-stats', methods=['GET'])
def get_embedding_stats():
    """Get statistics about current embeddings"""
    if not processor.embeddings or not processor.chunks:
        return jsonify({'error': 'No embeddings available'}), 400
    
    embeddings_array = np.array(processor.embeddings['embeddings'])
    
    stats = {
        'dimensions': embeddings_array.shape[1],
        'num_chunks': embeddings_array.shape[0],
        'sparsity': float(np.mean(embeddings_array == 0)),
        'mean_magnitude': float(np.mean(np.linalg.norm(embeddings_array, axis=1))),
        'feature_count': len(processor.embeddings['feature_names']),
        'top_features': processor.embeddings['feature_names'][:20],  # Top 20 features
        'method': processor.embeddings.get('method', 'unknown'),
        'model_id': processor.embeddings.get('model_id', 'unknown')
    }
    
    return jsonify({
        'success': True,
        'stats': stats
    })

@app.route('/api/bedrock/models', methods=['GET'])
def get_bedrock_models():
    """Get available Bedrock models"""
    return jsonify({
        'success': True,
        'bedrock_available': bedrock_available,
        'models': BEDROCK_MODELS
    })

@app.route('/api/bedrock/generate', methods=['POST'])
def bedrock_generate():
    """Generate text using Bedrock models"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        prompt = data.get('prompt', '')
        model_id = data.get('model_id', 'anthropic.claude-3-haiku-20240307-v1:0')
        
        # Generation parameters
        max_tokens = data.get('max_tokens', 1000)
        temperature = data.get('temperature', 0.7)
        top_p = data.get('top_p', 0.9)
        
        if not prompt.strip():
            return jsonify({'error': 'Prompt is required'}), 400
        
        if not bedrock_available:
            return jsonify({'error': 'Bedrock is not available. Please configure AWS credentials.'}), 503
        
        # Generate text using Bedrock
        generated_text = BedrockService.generate_text_bedrock(
            prompt=prompt,
            model_id=model_id,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p
        )
        
        return jsonify({
            'success': True,
            'generated_text': generated_text,
            'model_id': model_id,
            'parameters': {
                'max_tokens': max_tokens,
                'temperature': temperature,
                'top_p': top_p
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bedrock/embed', methods=['POST'])
def bedrock_embed():
    """Generate embeddings using Bedrock models"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        texts = data.get('texts', [])
        model_id = data.get('model_id', 'amazon.titan-embed-text-v1')
        
        if not texts:
            return jsonify({'error': 'Texts array is required'}), 400
        
        if not bedrock_available:
            return jsonify({'error': 'Bedrock is not available. Please configure AWS credentials.'}), 503
        
        # Generate embeddings using Bedrock
        embeddings = BedrockService.get_bedrock_embeddings_batch(texts, model_id)
        
        return jsonify({
            'success': True,
            'embeddings': embeddings,
            'model_id': model_id,
            'dimensions': len(embeddings[0]) if embeddings else 0,
            'count': len(embeddings),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bedrock/status', methods=['GET'])
def bedrock_status():
    """Check Bedrock availability and configuration"""
    return jsonify({
        'bedrock_available': bedrock_available,
        'aws_region': AWS_REGION,
        'bedrock_region': BEDROCK_REGION,
        'has_credentials': bool(os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('AWS_SECRET_ACCESS_KEY')),
        'available_models': {
            'embedding': list(BEDROCK_MODELS['embedding'].keys()),
            'generation': list(BEDROCK_MODELS['generation'].keys())
        }
    })

@app.route('/api/evaluate-rag', methods=['POST'])
def evaluate_rag():
    """Evaluate RAG pipeline results using LLM-as-a-Judge"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        query = data.get('query', '')
        retrieved_chunks = data.get('retrieved_chunks', [])
        generated_response = data.get('generated_response', '')
        evaluation_model = data.get('evaluation_model', 'anthropic.claude-3-haiku-20240307-v1:0')
        
        if not query.strip():
            return jsonify({'error': 'Query is required'}), 400
        
        if not retrieved_chunks:
            return jsonify({'error': 'Retrieved chunks are required'}), 400
            
        if not generated_response.strip():
            return jsonify({'error': 'Generated response is required'}), 400
        
        if not bedrock_available:
            return jsonify({'error': 'Bedrock is not available. Please configure AWS credentials.'}), 503
        
        # Prepare context from retrieved chunks
        context = '\n\n'.join([f"Chunk {i+1}: {chunk.get('content', '')}" 
                              for i, chunk in enumerate(retrieved_chunks)])
        
        # Create evaluation prompts for different aspects
        evaluations = {}
        
        # 1. Relevance Evaluation
        relevance_prompt = f"""You are an expert evaluator assessing the relevance of retrieved information for a RAG system.

Query: {query}

Retrieved Context:
{context}

Task: Evaluate how relevant the retrieved chunks are to answering the query.

Rate the relevance on a scale of 1-5:
1 = Not relevant at all
2 = Slightly relevant 
3 = Moderately relevant
4 = Highly relevant
5 = Perfectly relevant

Provide your rating and a brief explanation (2-3 sentences).

Format your response as:
Rating: [1-5]
Explanation: [Your explanation]"""

        # 2. Completeness Evaluation
        completeness_prompt = f"""You are an expert evaluator assessing the completeness of retrieved information for a RAG system.

Query: {query}

Retrieved Context:
{context}

Task: Evaluate whether the retrieved chunks contain sufficient information to fully answer the query.

Rate the completeness on a scale of 1-5:
1 = Missing critical information
2 = Incomplete, major gaps
3 = Adequate but some gaps
4 = Mostly complete
5 = Fully complete

Provide your rating and a brief explanation (2-3 sentences).

Format your response as:
Rating: [1-5]
Explanation: [Your explanation]"""

        # 3. Answer Quality Evaluation
        answer_quality_prompt = f"""You are an expert evaluator assessing the quality of AI-generated responses in a RAG system.

Query: {query}

Retrieved Context:
{context}

Generated Answer:
{generated_response}

Task: Evaluate the quality of the generated answer based on the retrieved context.

Consider these criteria:
- Accuracy: Is the answer factually correct based on the context?
- Completeness: Does it fully address the query?
- Clarity: Is it well-written and easy to understand?
- Relevance: Does it stay focused on the query?

Rate the answer quality on a scale of 1-5:
1 = Poor quality (inaccurate, incomplete, unclear)
2 = Below average quality
3 = Average quality
4 = Good quality
5 = Excellent quality

Provide your rating and a brief explanation (2-3 sentences).

Format your response as:
Rating: [1-5]
Explanation: [Your explanation]"""

        # 4. Faithfulness Evaluation
        faithfulness_prompt = f"""You are an expert evaluator assessing the faithfulness of AI-generated responses to the source context.

Query: {query}

Retrieved Context:
{context}

Generated Answer:
{generated_response}

Task: Evaluate whether the generated answer is faithful to the retrieved context (no hallucination).

Rate the faithfulness on a scale of 1-5:
1 = Contains significant hallucinations or contradictions
2 = Some inaccuracies or unsupported claims
3 = Mostly faithful with minor issues
4 = Highly faithful to the context
5 = Perfectly faithful, no hallucinations

Provide your rating and a brief explanation (2-3 sentences).

Format your response as:
Rating: [1-5]
Explanation: [Your explanation]"""

        # Execute evaluations
        evaluation_prompts = {
            'relevance': relevance_prompt,
            'completeness': completeness_prompt,
            'answer_quality': answer_quality_prompt,
            'faithfulness': faithfulness_prompt
        }
        
        for aspect, prompt in evaluation_prompts.items():
            try:
                evaluation_result = BedrockService.generate_text_bedrock(
                    prompt=prompt,
                    model_id=evaluation_model,
                    max_tokens=500,
                    temperature=0.1  # Low temperature for consistent evaluation
                )
                
                # Parse the evaluation result
                rating = None
                explanation = ""
                
                lines = evaluation_result.strip().split('\n')
                for line in lines:
                    if line.startswith('Rating:'):
                        try:
                            rating = int(line.split(':')[1].strip().split()[0])
                        except (ValueError, IndexError):
                            rating = None
                    elif line.startswith('Explanation:'):
                        explanation = line.split(':', 1)[1].strip()
                
                evaluations[aspect] = {
                    'rating': rating,
                    'explanation': explanation,
                    'raw_response': evaluation_result
                }
                
            except Exception as e:
                logger.error(f"Evaluation failed for {aspect}: {e}")
                evaluations[aspect] = {
                    'rating': None,
                    'explanation': f"Evaluation failed: {str(e)}",
                    'raw_response': ""
                }
        
        # Calculate overall score
        valid_ratings = [eval_data['rating'] for eval_data in evaluations.values() 
                        if eval_data['rating'] is not None]
        
        overall_score = sum(valid_ratings) / len(valid_ratings) if valid_ratings else 0
        
        # Generate summary evaluation
        summary_prompt = f"""You are an expert evaluator providing an overall assessment of a RAG system's performance.

Query: {query}

Individual Evaluation Scores:
- Relevance: {evaluations['relevance']['rating']}/5 - {evaluations['relevance']['explanation']}
- Completeness: {evaluations['completeness']['rating']}/5 - {evaluations['completeness']['explanation']}
- Answer Quality: {evaluations['answer_quality']['rating']}/5 - {evaluations['answer_quality']['explanation']}
- Faithfulness: {evaluations['faithfulness']['rating']}/5 - {evaluations['faithfulness']['explanation']}

Overall Score: {overall_score:.1f}/5

Task: Provide a concise overall assessment (3-4 sentences) summarizing the RAG system's performance and key strengths/weaknesses."""

        try:
            summary_evaluation = BedrockService.generate_text_bedrock(
                prompt=summary_prompt,
                model_id=evaluation_model,
                max_tokens=300,
                temperature=0.1
            )
        except Exception as e:
            logger.error(f"Summary evaluation failed: {e}")
            summary_evaluation = "Summary evaluation unavailable due to an error."
        
        return jsonify({
            'success': True,
            'evaluations': evaluations,
            'overall_score': round(overall_score, 2),
            'summary': summary_evaluation,
            'evaluation_model': evaluation_model,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error evaluating RAG: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluate-retrieval', methods=['POST'])
def evaluate_retrieval():
    """Evaluate just the retrieval quality (without generated response)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        query = data.get('query', '')
        retrieved_chunks = data.get('retrieved_chunks', [])
        evaluation_model = data.get('evaluation_model', 'anthropic.claude-3-haiku-20240307-v1:0')
        
        if not query.strip():
            return jsonify({'error': 'Query is required'}), 400
        
        if not retrieved_chunks:
            return jsonify({'error': 'Retrieved chunks are required'}), 400
        
        if not bedrock_available:
            return jsonify({'error': 'Bedrock is not available. Please configure AWS credentials.'}), 503
        
        # Prepare context from retrieved chunks
        context = '\n\n'.join([f"Chunk {i+1}: {chunk.get('content', '')}" 
                              for i, chunk in enumerate(retrieved_chunks)])
        
        # Evaluate retrieval quality
        retrieval_prompt = f"""You are an expert evaluator assessing the quality of information retrieval for a RAG system.

Query: {query}

Retrieved Chunks:
{context}

Task: Evaluate the retrieval quality across multiple dimensions:

1. Relevance: How relevant are the retrieved chunks to the query?
2. Coverage: Do the chunks cover the key aspects needed to answer the query?
3. Diversity: Do the chunks provide diverse perspectives or avoid redundancy?
4. Ranking Quality: Are the most relevant chunks ranked higher?

For each dimension, rate on a scale of 1-5 and provide brief reasoning.

Format your response as:
Relevance: [1-5] - [Brief explanation]
Coverage: [1-5] - [Brief explanation]  
Diversity: [1-5] - [Brief explanation]
Ranking: [1-5] - [Brief explanation]
Overall: [1-5] - [Overall assessment]"""

        try:
            evaluation_result = BedrockService.generate_text_bedrock(
                prompt=retrieval_prompt,
                model_id=evaluation_model,
                max_tokens=600,
                temperature=0.1
            )
            
            # Parse the evaluation result
            evaluations = {}
            lines = evaluation_result.strip().split('\n')
            
            for line in lines:
                for aspect in ['Relevance', 'Coverage', 'Diversity', 'Ranking', 'Overall']:
                    if line.startswith(f'{aspect}:'):
                        try:
                            parts = line.split(':', 1)[1].strip().split(' - ', 1)
                            rating = int(parts[0].strip())
                            explanation = parts[1].strip() if len(parts) > 1 else ""
                            evaluations[aspect.lower()] = {
                                'rating': rating,
                                'explanation': explanation
                            }
                        except (ValueError, IndexError):
                            pass
            
            return jsonify({
                'success': True,
                'evaluations': evaluations,
                'raw_response': evaluation_result,
                'evaluation_model': evaluation_model,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Retrieval evaluation failed: {e}")
            return jsonify({'error': f'Evaluation failed: {str(e)}'}), 500
        
    except Exception as e:
        logger.error(f"Error evaluating retrieval: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)