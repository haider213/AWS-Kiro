# Python Backend for RAG Document Processing

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure AWS credentials (for Bedrock features):
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

4. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Core Processing
- `GET /health` - Health check
- `POST /api/process-document` - Process document with chunking and embedding strategies
- `POST /api/search-chunks` - Search through processed chunks
- `GET /api/chunk-strategies` - Get available chunking strategies
- `GET /api/embedding-stats` - Get embedding statistics

### AWS Bedrock Integration
- `GET /api/bedrock/status` - Check Bedrock availability and configuration
- `GET /api/bedrock/models` - Get available Bedrock models
- `POST /api/bedrock/generate` - Generate text using Bedrock models
- `POST /api/bedrock/embed` - Generate embeddings using Bedrock models

## Features

### Document Processing
- Multiple chunking strategies (sentence-based, fixed-size, paragraph-based, semantic-based)
- Configurable chunk sizes, overlap, and parameters
- Text cleaning and preprocessing

### Embedding Generation
- **Local TF-IDF embeddings** (default, no AWS required)
- **AWS Bedrock embeddings** (Titan, Cohere models)
- Automatic fallback to TF-IDF if Bedrock unavailable
- t-SNE visualization coordinates
- Similarity calculations and search

### AI Text Generation
- **AWS Bedrock text generation** (Claude, Titan models)
- Configurable parameters (temperature, max_tokens, top_p)
- Support for multiple model providers

## Configuration

### Environment Variables
```bash
# AWS Configuration (required for Bedrock features)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_REGION=us-east-1

# Optional: Use AWS Profile instead
AWS_PROFILE=your_profile_name
```

### Supported Bedrock Models

**Embedding Models:**
- `amazon.titan-embed-text-v1` (1536 dimensions)
- `amazon.titan-embed-text-v2:0` (1024 dimensions)  
- `cohere.embed-english-v3` (1024 dimensions)

**Generation Models:**
- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`
- `amazon.titan-text-premier-v1:0`

## Usage Examples

### Process Document with Bedrock Embeddings
```bash
curl -X POST http://localhost:5000/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your document text here",
    "strategy": "sentence_based",
    "embedding_method": "bedrock",
    "embedding_model": "amazon.titan-embed-text-v1"
  }'
```

### Generate Text with Bedrock
```bash
curl -X POST http://localhost:5000/api/bedrock/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain RAG in simple terms",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0",
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

## Fallback Behavior

- If AWS credentials are not configured, the system automatically falls back to local TF-IDF embeddings
- Bedrock features will return appropriate error messages when unavailable
- All core chunking and visualization features work without AWS