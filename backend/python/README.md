# RAG Pipeline Educator - Python Backend

This Python backend provides real AI/ML functionality using LangChain and AWS Bedrock APIs for the RAG Pipeline Educator.

## Features

- **Advanced Chunking**: Uses LangChain's text splitters for intelligent document chunking
- **AWS Bedrock Integration**: Real embeddings and LLM generation using AWS Bedrock
- **Vector Search**: FAISS-powered similarity search with multiple metrics
- **Reranking**: Multiple reranking strategies (Cross-encoder, BM25, LLM-based)
- **Guardrails**: Safety and quality checks for prompts and responses
- **Multiple Models**: Support for various embedding and LLM models

## Setup

### 1. Install Dependencies

```bash
cd backend/python
pip install -r requirements.txt
```

### 2. Configure AWS Credentials

You need AWS credentials with access to Bedrock services:

```bash
# Option 1: AWS CLI
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# Option 3: IAM roles (if running on EC2)
```

### 3. Enable Bedrock Models

In the AWS Console, go to Bedrock > Model access and enable:
- Amazon Titan Text Embeddings v1
- Anthropic Claude 3 models
- Cohere Embed models (optional)

### 4. Start the Server

```bash
# Using the start script (recommended)
python start.py

# Or directly with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

### Core Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /models` - Available embedding and LLM models

### Chunking

- `POST /chunk` - Chunk text using various strategies
  - Fixed-size chunking
  - Sentence-based chunking  
  - Hierarchical chunking (parent-child)
  - Paragraph-based chunking

### Embeddings

- `POST /embed` - Generate embeddings using Bedrock models
  - Amazon Titan Text Embeddings
  - Cohere Embed models
  - Dimensionality reduction (PCA, t-SNE)

### Querying

- `POST /query` - Vector similarity search
  - Multiple similarity metrics (cosine, euclidean, manhattan)
  - Reranking strategies (cross-encoder, BM25, LLM-based)
  - Top-K retrieval

### Generation

- `POST /generate` - Generate responses using LLMs
  - Multiple prompt templates
  - Guardrail checks
  - Token usage tracking

## Supported Models

### Embedding Models
- `amazon.titan-embed-text-v1` - Amazon Titan Text Embeddings (1536D)
- `cohere.embed-english-v3` - Cohere English Embeddings (1024D)
- `cohere.embed-multilingual-v3` - Cohere Multilingual Embeddings (1024D)

### LLM Models
- `anthropic.claude-3-sonnet-20240229-v1:0` - Claude 3 Sonnet
- `anthropic.claude-3-haiku-20240307-v1:0` - Claude 3 Haiku
- `amazon.titan-text-premier-v1:0` - Amazon Titan Text Premier

## Environment Variables

- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

## Development

### Project Structure

```
backend/python/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── start.py            # Start script
├── README.md           # This file
└── .env               # Environment variables (optional)
```

### Adding New Features

1. **New Chunking Strategy**: Add function in `main.py` and update the `/chunk` endpoint
2. **New Reranking Method**: Add logic in `apply_reranking()` function
3. **New Guardrail**: Add check in `run_guardrails()` function
4. **New Model**: Update model lists in `/models` endpoint

## Troubleshooting

### Common Issues

1. **"Bedrock not available"**
   - Check AWS credentials
   - Verify Bedrock service availability in your region
   - Ensure model access is enabled in Bedrock console

2. **"Failed to load model"**
   - Check if the model ID is correct
   - Verify model access permissions
   - Try a different model

3. **Import errors**
   - Install requirements: `pip install -r requirements.txt`
   - Check Python version (3.8+ recommended)

### Fallback Mode

If Bedrock is not available, the backend will:
- Use sentence-transformers for embeddings (limited functionality)
- Disable LLM generation features
- Show warnings in API responses

## API Documentation

Once the server is running, visit:
- Interactive docs: http://localhost:8001/docs
- OpenAPI spec: http://localhost:8001/openapi.json

## Performance Tips

1. **Caching**: Models are cached after first load
2. **Batch Processing**: Process multiple chunks together when possible
3. **Dimensionality**: Use 2D/3D reduction only for visualization
4. **Chunking**: Choose appropriate chunk sizes for your use case

## Security

- Never commit AWS credentials to version control
- Use IAM roles when possible
- Implement rate limiting for production use
- Validate all input data

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints for new functions
3. Update this README for new features
4. Test with both Bedrock and fallback modes