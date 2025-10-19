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

3. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /api/process-document` - Process document with different chunking strategies
- `POST /api/search-chunks` - Search through processed chunks
- `GET /api/chunk-strategies` - Get available chunking strategies
- `GET /api/embedding-stats` - Get embedding statistics

## Features

- Multiple chunking strategies (sentence-based, fixed-size, paragraph-based, semantic-based)
- TF-IDF embeddings generation
- t-SNE visualization coordinates
- Similarity calculations
- Semantic search capabilities