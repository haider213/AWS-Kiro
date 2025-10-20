# 🚀 RAG Pipeline Educator

An interactive educational platform for learning Retrieval-Augmented Generation (RAG) systems through hands-on experimentation and comprehensive visualizations.

## 🚀 Quick Start

### 🎯 One-Command Launch (Recommended)
```bash
git clone <repository-url>
cd rag-pipeline-educator
./run-rag-app.sh
```

### ⚡ Quick Start (Simple)
```bash
./quick-start.sh
```

### 🪟 Windows Users
```cmd
run-rag-app.bat
```

### 🛠️ Manual Setup
```bash
# 1. Install dependencies
npm install
cd python_backend && pip install -r requirements.txt

# 2. Configure AWS (optional)
cp python_backend/.env.example python_backend/.env
# Edit .env with your AWS credentials

# 3. Start services
./run-rag-app.sh
```

### 🌐 Access Points
- **Frontend Application**: http://localhost:3000
- **Python Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## ✨ Features

### 📄 **Phase 1: Document Chunking**
- Multiple chunking strategies (sentence-based, fixed-size, paragraph-based, semantic-based)
- Interactive parameter controls and real-time visualization
- Chunk distribution analysis and statistics

### 🔢 **Phase 2: Vector Embeddings** 
- Amazon Bedrock embedding models (Titan, Cohere)
- t-SNE visualization and similarity matrix heatmaps
- Advanced settings for dimensions, normalization, and pooling

### 🔍 **Phase 3: Information Retrieval**
- Multiple similarity metrics (cosine, euclidean, dot product)
- Advanced retrieval settings with reranking and hybrid search
- Interactive query visualization in vector space

### 🤖 **Phase 4: Response Generation**
- Bedrock model selection (Claude 3 variants, Titan, Jamba, Llama)
- System prompt templates and generation parameter controls
- Prompt flow visualization and response analysis

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + D3.js
- **Backend**: Node.js + Express + TypeScript
- **Python Services**: Flask + scikit-learn + NLTK + NumPy + Pandas
- **AI Models**: Amazon Bedrock (Claude, Titan, Cohere, Meta Llama)
- **Visualizations**: D3.js + custom React components

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd rag-pipeline-educator

# Run the comprehensive startup script
./start-rag-pipeline.sh
```

That's it! The script will:
- ✅ Check system requirements
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Start all services (Frontend, Python Backend, Node.js Backend)
- ✅ Verify everything is working

### Manual Setup (if needed)

1. **Clean up any previous installations**
   ```bash
   ./cleanup-unused-files.sh
   ```

2. **System Requirements**
   - Node.js 18+ 
   - Python 3.8+
   - npm or yarn

3. **Run the startup script**
   ```bash
   ./start-rag-pipeline.sh
   ```

## 🌐 Access Points

Once started, access the application at:

- **🌐 Frontend**: http://localhost:3000 (Main RAG Pipeline Interface)
- **🐍 Python Backend**: http://localhost:5000 (Document Processing & Embeddings)
- **📊 Node.js Backend**: http://localhost:3001 (AI Generation & Models)

## 📁 Project Structure

```
rag-pipeline-educator/
├── 🚀 start-rag-pipeline.sh          # One-command startup script
├── 🧹 cleanup-unused-files.sh        # Cleanup script
├── src/                               # Frontend React application
│   ├── components/
│   │   ├── ComprehensiveRAGPipeline.tsx    # Main pipeline orchestrator
│   │   ├── phases/                         # Individual phase components
│   │   │   ├── ChunkingPhase.tsx          # Document chunking interface
│   │   │   ├── EmbeddingPhase.tsx         # Vector embedding controls
│   │   │   ├── RetrievalPhase.tsx         # Information retrieval
│   │   │   └── GenerationPhase.tsx        # Response generation
│   │   ├── ChunkingVisualization.tsx      # Chunking visualizations
│   │   ├── EmbeddingVisualization.tsx     # Embedding visualizations
│   │   ├── SimpleQueryingVisualization.tsx # Query visualizations
│   │   └── SystemPromptVisualization.tsx   # Prompt flow analysis
│   └── SimpleApp.tsx                      # Main app entry point
├── backend/                               # Node.js backend
│   ├── src/
│   │   ├── routes/                        # API routes
│   │   └── services/                      # Backend services
│   └── package.json
├── python_backend/                        # Python Flask backend
│   ├── app.py                            # Main Flask application
│   └── requirements.txt                   # Python dependencies
└── package.json                          # Frontend dependencies
```

## 🔧 Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload (if Node.js backend works)
```

### Python Backend Development
```bash
cd python_backend
source venv_clean/bin/activate
python3 app.py       # Start Flask development server
```

## 🔌 API Endpoints

### Python Backend (Port 5000)
- `GET /health` - Health check
- `POST /api/process-document` - Process and chunk documents
- `POST /api/search-chunks` - Search through processed chunks  
- `GET /api/chunk-strategies` - Get available chunking strategies
- `GET /api/embedding-stats` - Get embedding statistics

### Node.js Backend (Port 3001) - Optional
- `GET /health` - Health check
- `POST /api/generation/response` - Generate AI responses
- `GET /api/models/embedding` - Get available embedding models
- `GET /api/models/generation` - Get available generation models

## ⚙️ Configuration

### Environment Variables

The startup script handles most configuration automatically. For custom setups:

**Root `.env`:**
```env
VITE_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:5000
```

**Backend `.env`:**
```env
PORT=3001
AWS_REGION=us-east-1
# Add your AWS credentials for Bedrock access
```

## 🎯 Usage Guide

1. **Start with Document Chunking**: Upload or paste text to see different chunking strategies
2. **Explore Embeddings**: Visualize how text becomes vectors with t-SNE plots
3. **Test Retrieval**: Query your documents and see similarity matching in action
4. **Generate Responses**: Use retrieved context to generate AI responses

## 🧹 Maintenance

### Clean Installation
```bash
./cleanup-unused-files.sh  # Remove old files and dependencies
./start-rag-pipeline.sh    # Fresh installation and startup
```

### Stop Services
Press `Ctrl+C` in the terminal running the startup script to stop all services.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎉 Ready to explore RAG systems? Run `./start-rag-pipeline.sh` and visit http://localhost:3000!**