# RAG Pipeline Educator - Backend API

This is the backend API server for the RAG Pipeline Educator, providing AWS Bedrock integration for embedding generation and text generation capabilities.

## Features

- **AWS Bedrock Integration**: Direct integration with Amazon Bedrock for embeddings and text generation
- **Request Caching**: Intelligent caching layer to optimize Bedrock usage and reduce costs
- **Rate Limiting**: Multiple levels of rate limiting for different operation types
- **Input Validation**: Comprehensive request validation using Zod schemas
- **Authentication**: Optional API key authentication for production environments
- **Error Handling**: Robust error handling with detailed error messages

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure your AWS credentials in `.env`:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   BEDROCK_REGION=us-east-1
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Embeddings
- `POST /api/embeddings/generate` - Generate embeddings for text chunks
- `POST /api/embeddings/similarity` - Calculate similarity between embeddings

### Text Generation
- `POST /api/generation/response` - Generate text response using Bedrock
- `POST /api/generation/compare` - Compare responses from multiple models

### Models
- `GET /api/models/embedding` - Get available embedding models
- `GET /api/models/generation` - Get available generation models

## Request Examples

### Generate Embeddings
```bash
curl -X POST http://localhost:3001/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello world", "How are you?"],
    "model": "amazon.titan-embed-text-v1"
  }'
```

### Generate Response
```bash
curl -X POST http://localhost:3001/api/generation/response \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain what RAG is in simple terms",
    "model": "anthropic.claude-3-haiku-20240307-v1:0",
    "parameters": {
      "temperature": 0.7
    }
  }'
```

## Caching Strategy

The API implements intelligent caching to optimize Bedrock usage:

- **Embeddings**: Cached for 10 minutes
- **Text Generation**: Cached for 15 minutes  
- **Model Information**: Cached for 1 hour
- **Similarity Calculations**: Cached for 30 minutes

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Expensive Operations**: 10 requests per minute per IP (embeddings, generation)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run lint` - Run ESLint