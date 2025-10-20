# 🚀 RAG Pipeline Educator

An interactive educational platform for learning Retrieval-Augmented Generation (RAG) systems through hands-on experimentation, advanced reranking methods, and comprehensive LLM-as-a-Judge evaluation.

## 🚀 Quick Start

### 🎯 One-Command Launch (Recommended)
```bash
git clone <repository-url>
cd rag-pipeline-educator
./run-rag-app.sh
```

This comprehensive script will:
- ✅ Check system requirements (Node.js 18+, Python 3.8+)
- ✅ Set up Python virtual environment with all dependencies
- ✅ Install frontend dependencies
- ✅ Download required NLTK data
- ✅ Start both frontend and backend services
- ✅ Verify AWS Bedrock integration
- ✅ Display access URLs and feature overview

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

# 2. Configure AWS (required for embeddings and generation)
cp python_backend/.env.example python_backend/.env
# Edit .env with your AWS credentials

# 3. Start services
./run-rag-app.sh
```

### 🌐 Access Points
- **🌐 Frontend Application**: http://localhost:3000
- **🐍 Python Backend API**: http://localhost:5000
- **📊 Health Check**: http://localhost:5000/health
- **🧪 Reranking Demo**: http://localhost:3000/test-reranking.html

## ✨ Features

### 📄 **Phase 1: Document Chunking**
- **4 Chunking Strategies**: Sentence-based, fixed-size, paragraph-based, semantic-based
- **Interactive Controls**: Real-time parameter adjustment with instant preview
- **Visual Analytics**: Chunk distribution, size analysis, and overlap visualization
- **Smart Defaults**: Optimized parameters for different document types

### 🔢 **Phase 2: Vector Embeddings** 
- **AWS Bedrock Models**: Amazon Titan v1/v2, Cohere Embed English v3
- **Advanced Visualizations**: t-SNE plots, similarity heatmaps, embedding space exploration
- **Model Comparison**: Side-by-side embedding quality analysis
- **Dimension Analysis**: 1024D (Titan v2, Cohere) or 1536D (Titan v1) embeddings

### 🔍 **Phase 3: Information Retrieval & Advanced Reranking**
- **3 Similarity Metrics**: Cosine similarity, Euclidean distance, dot product
- **6 Reranking Methods**:
  - 🎯 **No Reranking**: Pure similarity-based ranking
  - 🔍 **BM25 Hybrid**: Combines semantic similarity with keyword matching
  - 🧠 **Cross-Encoder**: Deep query-document interaction modeling
  - 🌈 **Diversity Reranking**: Promotes diverse results, reduces redundancy
  - 📏 **Length Optimization**: Prefers chunks of optimal length
  - 🎯 **Keyword Boosting**: Boosts exact keyword matches
- **Visual Comparison**: Side-by-side original vs reranked results
- **Reranking Analytics**: Detailed scores, rank changes, and method explanations
- **Interactive Demo**: Standalone reranking comparison tool

### 🤖 **Phase 4: Response Generation**
- **Multiple Models**: Claude 3 Haiku/Sonnet, Amazon Titan Premier
- **Context Integration**: Smart prompt construction with retrieved chunks
- **Generation Controls**: Temperature, top-p, max tokens, and custom prompts
- **Source Attribution**: Traceable references to original chunks

### ⚖️ **Phase 5: LLM-as-a-Judge Evaluation** *(NEW)*
- **End-to-End RAG Evaluation**:
  - 🎯 **Relevance**: How well retrieved chunks match the query
  - 📋 **Completeness**: Whether chunks contain sufficient information
  - ✨ **Answer Quality**: Accuracy, clarity, and completeness of generated response
  - 🔒 **Faithfulness**: Whether answer stays true to source context (no hallucination)
- **Retrieval-Only Evaluation**:
  - 🎯 **Relevance**: How relevant chunks are to the query
  - 📊 **Coverage**: Whether key aspects are covered
  - 🌈 **Diversity**: Variety of perspectives, avoiding redundancy
  - 📈 **Ranking Quality**: Whether most relevant chunks are ranked higher
- **Automated Scoring**: 1-5 scale with detailed explanations
- **Overall Assessment**: Weighted scores and comprehensive summary
- **Claude 3 Judge**: Uses Claude 3 as the evaluation model for objective assessment

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + D3.js
- **Backend**: Python Flask + LangChain + scikit-learn + NLTK + NumPy + Pandas
- **AI Models**: Amazon Bedrock (Claude 3, Titan, Cohere)
- **Embeddings**: AWS Bedrock Titan v1/v2, Cohere Embed English v3
- **Generation**: Claude 3 Haiku/Sonnet, Amazon Titan Premier
- **Evaluation**: LLM-as-a-Judge using Claude 3 for automated assessment
- **Visualizations**: D3.js + custom React components + t-SNE plots

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18+ (check with `node --version`)
- **Python**: 3.8+ (check with `python3 --version`)
- **npm**: Latest version (check with `npm --version`)
- **AWS Account**: For Bedrock access (optional but recommended)

### AWS Setup (Recommended)
1. **Create AWS Account** and set up Bedrock access
2. **Configure Credentials**:
   ```bash
   # Option 1: AWS CLI
   aws configure
   
   # Option 2: Environment Variables
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-east-1
   
   # Option 3: Edit .env file (created by setup script)
   cp python_backend/.env.example python_backend/.env
   # Edit with your credentials
   ```

## 🚀 Installation & Setup

### 🎯 One-Command Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd rag-pipeline-educator

# Run the comprehensive startup script
./run-rag-app.sh
```

**What the script does:**
- ✅ Checks system requirements (Node.js 18+, Python 3.8+)
- ✅ Verifies port availability (3000, 5000)
- ✅ Creates Python virtual environment (`venv_clean`)
- ✅ Installs all Python dependencies (Flask, LangChain, scikit-learn, etc.)
- ✅ Downloads NLTK data (punkt, stopwords)
- ✅ Installs frontend dependencies (React, TypeScript, Vite, etc.)
- ✅ Starts Python backend on port 5000
- ✅ Starts React frontend on port 3000
- ✅ Verifies AWS Bedrock integration
- ✅ Displays comprehensive feature overview and access URLs

### ⚡ Alternative: Quick Start
```bash
./quick-start.sh  # Simpler version with basic setup
```

### 🛠️ Manual Setup (Advanced Users)

1. **Install Dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Python backend dependencies
   cd python_backend
   python3 -m venv venv_clean
   source venv_clean/bin/activate
   pip install -r requirements.txt
   cd ..
   ```

2. **Configure Environment**
   ```bash
   cp python_backend/.env.example python_backend/.env
   # Edit .env with your AWS credentials
   ```

3. **Start Services**
   ```bash
   # Terminal 1: Python Backend
   cd python_backend
   source venv_clean/bin/activate
   python3 app.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

## 🌐 Access Points & Testing

### Main Application
- **🌐 Frontend**: http://localhost:3000 (Main RAG Pipeline Interface)
- **🐍 Backend API**: http://localhost:5000 (Document Processing & AI Services)
- **📊 Health Check**: http://localhost:5000/health

### Testing & Demo Pages
- **🧪 Reranking Demo**: http://localhost:3000/test-reranking.html
- **⚖️ Evaluation Test**: Run `./test-evaluation.sh`
- **🔄 Reranking Test**: Run `./test-all-reranking.sh`

### Quick Tests
```bash
# Test all reranking methods
./test-all-reranking.sh

# Test LLM-as-a-Judge evaluation
./test-evaluation.sh

# Test individual endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/bedrock/status
```

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

## 🎯 Complete Usage Guide

### Step-by-Step Walkthrough

1. **🚀 Start the Application**
   ```bash
   ./run-rag-app.sh
   ```
   Wait for "RAG Pipeline Educator is Ready!" message

2. **🌐 Open the Interface**
   - Navigate to http://localhost:3000
   - You'll see the 5-phase RAG pipeline interface

3. **📄 Phase 1: Document Chunking**
   - The default document about RAG is pre-loaded
   - Try different chunking strategies:
     - **Sentence-based**: Each sentence becomes a chunk
     - **Fixed-size**: Consistent character-length chunks
     - **Paragraph-based**: Natural paragraph boundaries
     - **Semantic-based**: AI-powered semantic grouping
   - Adjust parameters and see real-time updates

4. **🔢 Phase 2: Vector Embeddings**
   - Embeddings are generated automatically using AWS Bedrock
   - Choose between Titan v1 (1536D), Titan v2 (1024D), or Cohere (1024D)
   - View t-SNE visualization of embedding space

5. **🔍 Phase 3: Information Retrieval & Reranking**
   - Enter a query: "What are the benefits of RAG?"
   - Select similarity metric (cosine, euclidean, dot product)
   - **Try different reranking methods**:
     - Start with "No Reranking" to see baseline
     - Switch to "Keyword Boosting" and see rank changes
     - Try "BM25 Hybrid" for balanced semantic + keyword matching
     - Experiment with "Diversity Reranking" to reduce redundancy
   - **Enable comparison view** to see side-by-side results
   - Notice rank changes and additional scores (BM25, keyword, etc.)

6. **🤖 Phase 4: Response Generation**
   - Generate AI response using retrieved context
   - Try different models (Claude 3 Haiku, Sonnet, Titan Premier)
   - Adjust temperature and other generation parameters

7. **⚖️ Phase 5: LLM-as-a-Judge Evaluation**
   - **End-to-End RAG Evaluation**: Evaluates complete pipeline
     - Relevance, Completeness, Answer Quality, Faithfulness
     - Overall score and detailed explanations
   - **Retrieval-Only Evaluation**: Focuses just on retrieval quality
     - Relevance, Coverage, Diversity, Ranking Quality
   - View detailed scores (1-5 scale) with explanations

### Advanced Features

#### 🔄 Reranking Comparison
- Use the comparison toggle in Phase 3 to see original vs reranked results
- Notice how different methods change ranking order
- Pay attention to rank change indicators (e.g., "was #3, now #1")

#### 🧪 Standalone Testing
```bash
# Test all reranking methods with detailed output
./test-all-reranking.sh

# Test evaluation system
./test-evaluation.sh

# Interactive reranking demo
open http://localhost:3000/test-reranking.html
```

#### 📊 Understanding Scores
- **Similarity Score**: Original vector similarity (cosine, euclidean, etc.)
- **Combined Score**: Weighted combination of similarity + reranking method
- **BM25 Score**: Keyword-based relevance score
- **Keyword Score**: Exact keyword match bonus
- **Diversity Score**: Measure of result diversity
- **Evaluation Scores**: LLM judge ratings (1-5 scale)

## 🔌 API Endpoints

### Core RAG Pipeline
- `POST /api/process-document` - Process and chunk documents
- `POST /api/search-chunks` - Search with reranking
- `POST /api/bedrock/generate` - Generate AI responses
- `POST /api/bedrock/embed` - Generate embeddings

### Evaluation System *(NEW)*
- `POST /api/evaluate-rag` - Complete RAG pipeline evaluation
- `POST /api/evaluate-retrieval` - Retrieval-only evaluation

### System & Configuration
- `GET /health` - Health check
- `GET /api/bedrock/status` - AWS Bedrock status
- `GET /api/bedrock/models` - Available models
- `GET /api/chunk-strategies` - Chunking strategies
- `GET /api/embedding-stats` - Embedding statistics

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

## 🔧 Configuration & Environment

### Environment Variables

**Python Backend (.env)**:
```env
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1

# Optional: Custom settings
FLASK_ENV=development
FLASK_DEBUG=True
```

**Frontend (.env.local)** - Optional:
```env
VITE_BACKEND_URL=http://localhost:5000
```

### AWS Bedrock Models Used
- **Embeddings**: 
  - `amazon.titan-embed-text-v1` (1536 dimensions)
  - `amazon.titan-embed-text-v2:0` (1024 dimensions)
  - `cohere.embed-english-v3` (1024 dimensions)
- **Generation**: 
  - `anthropic.claude-3-haiku-20240307-v1:0`
  - `anthropic.claude-3-sonnet-20240229-v1:0`
  - `amazon.titan-text-premier-v1:0`

## 🚨 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**2. Python Dependencies Issues**
```bash
# Clean reinstall
rm -rf python_backend/venv_clean
python3 -m venv python_backend/venv_clean
source python_backend/venv_clean/bin/activate
pip install --upgrade pip
pip install -r python_backend/requirements.txt
```

**3. AWS Bedrock Access Issues**
- Ensure your AWS account has Bedrock access enabled
- Check your AWS credentials are correctly configured
- Verify the region supports Bedrock (us-east-1 recommended)
- Test with: `curl http://localhost:5000/api/bedrock/status`

**4. Frontend Build Issues**
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. NLTK Data Missing**
```bash
python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Verification Steps

1. **Check System Requirements**:
   ```bash
   node --version  # Should be 18+
   python3 --version  # Should be 3.8+
   npm --version
   ```

2. **Test Backend**:
   ```bash
   curl http://localhost:5000/health
   curl http://localhost:5000/api/bedrock/status
   ```

3. **Test Frontend**: 
   - Open http://localhost:3000
   - Should see RAG Pipeline interface

4. **Test Complete Pipeline**:
   ```bash
   ./test-all-reranking.sh
   ./test-evaluation.sh
   ```

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