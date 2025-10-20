# 🚀 RAG Pipeline Educator - Startup Guide

This guide provides multiple ways to run the RAG Pipeline Educator application.

## 📋 Available Startup Scripts

### 1. 🎯 **run-rag-app.sh** (Recommended)
**Full-featured startup script with comprehensive checks and setup**

```bash
./run-rag-app.sh
```

**Features:**
- ✅ System requirements validation
- ✅ Port availability checking
- ✅ Automatic dependency installation
- ✅ Virtual environment setup
- ✅ Service health monitoring
- ✅ AWS Bedrock status verification
- ✅ Colored output and progress indicators
- ✅ Graceful shutdown handling

### 2. ⚡ **quick-start.sh** (Fast)
**Simple and fast startup for development**

```bash
./quick-start.sh
```

**Features:**
- ⚡ Quick startup (minimal checks)
- 🔄 Automatic process cleanup
- 📝 Basic status messages

### 3. 🪟 **run-rag-app.bat** (Windows)
**Windows batch file for Windows users**

```cmd
run-rag-app.bat
```

**Features:**
- 🪟 Windows-compatible
- ✅ System requirements checking
- 📂 Automatic window management
- 🎯 User-friendly interface

### 4. 📜 **start-rag-pipeline.sh** (Legacy)
**Original comprehensive startup script**

```bash
./start-rag-pipeline.sh
```

## 🛠️ Manual Startup (Advanced Users)

### Terminal 1: Python Backend
```bash
cd python_backend
source venv_clean/bin/activate
python app.py
```

### Terminal 2: React Frontend
```bash
npm run dev
```

## 🌐 Application URLs

Once started, access the application at:

- **🎓 Main Application**: http://localhost:3000
- **🐍 Backend API**: http://localhost:5000
- **❤️ Health Check**: http://localhost:5000/health
- **🔧 Bedrock Status**: http://localhost:5000/api/bedrock/status

## 🎯 Quick Workflow

1. **Start Application**: Use any startup script above
2. **Phase 1**: Process document with sentence-based chunking
3. **Phase 2**: Generate Bedrock embeddings (automatic)
4. **Phase 3**: Search with queries and experiment with reranking
5. **Phase 4**: Generate AI responses using retrieved context

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
pkill -f "npm.*dev"
pkill -f "python.*app.py"
```

### Python Dependencies
```bash
cd python_backend
source venv_clean/bin/activate
pip install -r requirements.txt
```

### Node Dependencies
```bash
npm install
```

### AWS Bedrock Issues
1. Check your AWS credentials in `python_backend/.env`
2. Verify AWS region is supported for Bedrock
3. Ensure you have access to the required models

## 📊 System Requirements

- **Node.js**: 18+ (for frontend)
- **Python**: 3.8+ (for backend)
- **npm**: Latest version
- **AWS Account**: Optional (for Bedrock features)

## 🎓 Educational Features

The application demonstrates:
- **Document Chunking**: 4 different strategies
- **Vector Embeddings**: AWS Bedrock integration
- **Information Retrieval**: 6 reranking methods
- **Response Generation**: Claude 3 and Titan models
- **Interactive Visualizations**: D3.js charts and plots

## 🆘 Support

If you encounter issues:
1. Check the terminal output for error messages
2. Verify all dependencies are installed
3. Ensure ports 3000 and 5000 are available
4. Check AWS credentials if using Bedrock features

---

**Happy Learning! 🎉**