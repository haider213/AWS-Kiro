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
        
    def clean_text(self, text):
        """Clean and preprocess text"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove special characters but keep punctuation for sentence boundaries
        text = re.sub(r'[^\w\s\.\!\?\,\;\:]', '', text)
        return text
    
    def chunk_by_sentences(self, text, sentences_per_chunk=3, overlap=1):
        """Chunk text by sentences with overlap"""
        sentences = sent_tokenize(text)
        chunks = []
        
        for i in range(0, len(sentences), sentences_per_chunk - overlap):
            chunk_sentences = sentences[i:i + sentences_per_chunk]
            if chunk_sentences:
                chunk_text = ' '.join(chunk_sentences)
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'content': chunk_text,
                    'start_sentence': i,
                    'end_sentence': min(i + sentences_per_chunk - 1, len(sentences) - 1),
                    'word_count': len(word_tokenize(chunk_text)),
                    'char_count': len(chunk_text),
                    'strategy': 'sentence_based'
                })
        
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
    
    def chunk_by_semantic(self, text, similarity_threshold=0.5):
        """Chunk text by semantic similarity (simplified version)"""
        sentences = sent_tokenize(text)
        if len(sentences) < 2:
            return self.chunk_by_sentences(text)
        
        # Create embeddings for sentences
        sentence_vectors = self.vectorizer.fit_transform(sentences)
        
        chunks = []
        current_chunk = [sentences[0]]
        current_chunk_idx = [0]
        
        for i in range(1, len(sentences)):
            # Calculate similarity with current chunk
            current_chunk_vector = sentence_vectors[current_chunk_idx].mean(axis=0)
            sentence_vector = sentence_vectors[i]
            
            similarity = cosine_similarity(current_chunk_vector, sentence_vector)[0][0]
            
            if similarity > similarity_threshold and len(current_chunk) < 5:
                current_chunk.append(sentences[i])
                current_chunk_idx.append(i)
            else:
                # Save current chunk and start new one
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    'id': str(uuid.uuid4()),
                    'content': chunk_text,
                    'sentence_indices': current_chunk_idx.copy(),
                    'word_count': len(word_tokenize(chunk_text)),
                    'char_count': len(chunk_text),
                    'strategy': 'semantic_based',
                    'avg_similarity': similarity
                })
                
                current_chunk = [sentences[i]]
                current_chunk_idx = [i]
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                'id': str(uuid.uuid4()),
                'content': chunk_text,
                'sentence_indices': current_chunk_idx,
                'word_count': len(word_tokenize(chunk_text)),
                'char_count': len(chunk_text),
                'strategy': 'semantic_based'
            })
        
        return chunks
    
    def generate_embeddings(self, chunks):
        """Generate TF-IDF embeddings for chunks"""
        if not chunks:
            return None
        
        texts = [chunk['content'] for chunk in chunks]
        embeddings = self.vectorizer.fit_transform(texts)
        
        # Convert to dense array for easier handling
        embeddings_dense = embeddings.toarray()
        
        # Generate t-SNE coordinates for visualization
        if len(chunks) > 1:
            tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(chunks)-1))
            tsne_coords = tsne.fit_transform(embeddings_dense)
        else:
            tsne_coords = np.array([[0, 0]])
        
        return {
            'embeddings': embeddings_dense.tolist(),
            'tsne_coordinates': tsne_coords.tolist(),
            'feature_names': self.vectorizer.get_feature_names_out().tolist()
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

@app.route('/api/process-document', methods=['POST'])
def process_document():
    try:
        data = request.get_json()
        text = data.get('text', '')
        strategy = data.get('strategy', 'sentence_based')
        
        # Strategy-specific parameters
        chunk_size = data.get('chunk_size', 500)
        overlap = data.get('overlap', 50)
        sentences_per_chunk = data.get('sentences_per_chunk', 3)
        similarity_threshold = data.get('similarity_threshold', 0.5)
        
        if not text.strip():
            return jsonify({'error': 'Text is required'}), 400
        
        # Clean the text
        cleaned_text = processor.clean_text(text)
        
        # Apply chunking strategy
        if strategy == 'sentence_based':
            chunks = processor.chunk_by_sentences(
                cleaned_text, 
                sentences_per_chunk=sentences_per_chunk,
                overlap=overlap
            )
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
                similarity_threshold=similarity_threshold
            )
        else:
            return jsonify({'error': 'Invalid chunking strategy'}), 400
        
        # Generate embeddings and visualizations
        embeddings_data = processor.generate_embeddings(chunks)
        similarities = processor.calculate_similarities(chunks, embeddings_data)
        
        # Store for later use
        processor.chunks = chunks
        processor.embeddings = embeddings_data
        
        # Calculate statistics
        stats = {
            'total_chunks': len(chunks),
            'avg_chunk_size': np.mean([chunk['char_count'] for chunk in chunks]),
            'avg_word_count': np.mean([chunk['word_count'] for chunk in chunks]),
            'strategy_used': strategy,
            'total_characters': len(cleaned_text),
            'total_words': len(word_tokenize(cleaned_text))
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

@app.route('/api/search-chunks', methods=['POST'])
def search_chunks():
    try:
        data = request.get_json()
        query = data.get('query', '')
        top_k = data.get('top_k', 5)
        
        if not query.strip():
            return jsonify({'error': 'Query is required'}), 400
        
        if not processor.chunks or not processor.embeddings:
            return jsonify({'error': 'No document processed yet'}), 400
        
        # Generate query embedding
        query_embedding = processor.vectorizer.transform([query]).toarray()[0]
        
        # Calculate similarities with all chunks
        chunk_embeddings = np.array(processor.embeddings['embeddings'])
        similarities = cosine_similarity([query_embedding], chunk_embeddings)[0]
        
        # Get top-k results
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            chunk = processor.chunks[idx]
            results.append({
                **chunk,
                'similarity_score': float(similarities[idx]),
                'rank': len(results) + 1
            })
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'total_chunks_searched': len(processor.chunks),
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
            'description': 'Groups sentences together with configurable overlap',
            'parameters': {
                'sentences_per_chunk': {'type': 'int', 'default': 3, 'min': 1, 'max': 10},
                'overlap': {'type': 'int', 'default': 1, 'min': 0, 'max': 5}
            },
            'pros': ['Preserves sentence boundaries', 'Good for readability', 'Natural language flow'],
            'cons': ['Variable chunk sizes', 'May break semantic units']
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
        'top_features': processor.embeddings['feature_names'][:20]  # Top 20 features
    }
    
    return jsonify({
        'success': True,
        'stats': stats
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)