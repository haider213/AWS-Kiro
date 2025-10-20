# 🚀 RAG Pipeline Educator - Complete Setup Guide

This guide provides detailed instructions for setting up and running the RAG Pipeline Educator with all its advanced features including reranking and LLM-as-a-Judge evaluation.

## 📋 Prerequisites Checklist

### System Requirements
- [ ] **Node.js 18+** - `node --version`
- [ ] **Python 3.8+** - `python3 --version`  
- [ ] **npm** - `npm --version`
- [ ] **Git** - `git --version`
- [ ] **curl** (for testing) - `curl --version`

### AWS Account Setup (Recommended)
- [ ] AWS Account with Bedrock access
- [ ] AWS credentials configured
- [ ] Bedrock models enabled in your region

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd rag-pipeline-educator

# One-command setup and launch
./run-rag-app.sh
```

### 2. Wait for Success Message
Look for this output:
```
🎉 RAG Pipeline Educator is Ready!

✅ All services are running successfully:
   🌐 Frontend Application:  http://localhost:3000
   🐍 Python Backend API:   http://localhost:5000

💡 Quick Start Guide:
   1. Open http://localhost:3000 in your browser
   2. Start with Phase 1: Process a document using sentence-based chunking
   3. Phase 2: Generate Bedrock embeddings automatically
   4. Phase 3: Search with queries and experiment with reranking methods
   5. Phase 4: Generate AI responses using retrieved context
   6. Phase 5: Evaluate pipeline performance with LLM-as-a-Judge
```

### 3. Open and Explore
- **Main App**: http://localhost:3000
- **Reranking Demo**: http://localhost:3000/test-reranking.html

## 🔧 Detailed Setup Instructions

### Step 1: System Preparation

**Check Prerequisites:**
```bash
# Verify versions
node --version    # Should show v18.x.x or higher
python3 --version # Should show 3.8.x or higher
npm --version     # Should show 8.x.x or higher
```

**Install Missing Dependencies:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm python3 python3-pip python3-venv

# macOS (with Homebrew)
brew install node python@3.11

# Windows (with Chocolatey)
choco install nodejs python
```

### Step 2: AWS Configuration

**Option A: AWS CLI (Recommended)**
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
# Enter your Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)
```

**Option B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-east-1
```

**Option C: Manual .env File**
```bash
# After running the setup script, edit the .env file
cp python_backend/.env.example python_backend/.env
nano python_backend/.env

# Add your credentials:
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1
```

### Step 3: Run Setup Script

```bash
# Make script executable
chmod +x run-rag-app.sh

# Run comprehensive setup
./run-rag-app.sh
```

**What the script does:**
1. **System Check**: Verifies Node.js, Python, npm versions
2. **Port Check**: Ensures ports 3000 and 5000 are available
3. **Python Environment**: Creates `venv_clean` virtual environment
4. **Dependencies**: Installs all Python packages (Flask, LangChain, scikit-learn, etc.)
5. **NLTK Data**: Downloads required tokenizers and stopwords
6. **Frontend**: Installs React, TypeScript, Vite dependencies
7. **Services**: Starts both backend (port 5000) and frontend (port 3000)
8. **Verification**: Tests all endpoints and AWS Bedrock integration

## 🧪 Testing Your Setup

### 1. Basic Health Checks
```bash
# Test backend health
curl http://localhost:5000/health

# Test Bedrock integration
curl http://localhost:5000/api/bedrock/status

# Expected response:
# {"bedrock_available": true, "aws_region": "us-east-1", ...}
```

### 2. Test Reranking System
```bash
# Run comprehensive reranking tests
./test-all-reranking.sh

# Expected output shows all 6 reranking methods working:
# ✅ none, bm25, cross_encoder, diversity, length_penalty, keyword_boost
```

### 3. Test Evaluation System
```bash
# Run LLM-as-a-Judge evaluation tests
./test-evaluation.sh

# Expected output shows evaluation scores:
# ✅ Retrieval evaluation SUCCESS
# ✅ RAG evaluation SUCCESS with scores 1-5
```

### 4. Interactive Testing
```bash
# Open the reranking demo page
open http://localhost:3000/test-reranking.html

# Or visit in browser and click "Test All Methods"
```

## 🎯 Feature Walkthrough

### Phase 1: Document Chunking
1. **Default Document**: Pre-loaded RAG explanation text
2. **Try Strategies**: 
   - Sentence-based (default)
   - Fixed-size (500 chars, 50 overlap)
   - Paragraph-based
   - Semantic-based (AI-powered)
3. **Observe**: Chunk count, size distribution, content preview

### Phase 2: Vector Embeddings
1. **Automatic Generation**: Happens when you process document
2. **Model Options**: Titan v1 (1536D), Titan v2 (1024D), Cohere (1024D)
3. **Visualization**: t-SNE plot shows embedding relationships

### Phase 3: Information Retrieval & Reranking
1. **Enter Query**: "What are the benefits of RAG?"
2. **Choose Metric**: Cosine similarity (recommended)
3. **Select Reranking**: Start with "none", then try others
4. **Key Features**:
   - **Rank Changes**: See items move positions (e.g., "was #3, now #1")
   - **Multiple Scores**: Similarity, BM25, keyword, combined scores
   - **Comparison View**: Side-by-side original vs reranked
   - **Method Explanations**: Understand why ranks changed

### Phase 4: Response Generation
1. **Automatic Context**: Uses retrieved chunks as context
2. **Model Selection**: Claude 3 Haiku (fast) or Sonnet (better quality)
3. **Parameters**: Adjust temperature, max tokens
4. **Source Attribution**: See which chunks influenced the response

### Phase 5: LLM-as-a-Judge Evaluation
1. **End-to-End Evaluation**:
   - Relevance: How well chunks match query
   - Completeness: Sufficient information coverage
   - Answer Quality: Response accuracy and clarity
   - Faithfulness: No hallucinations, stays true to sources
2. **Retrieval-Only Evaluation**:
   - Relevance: Chunk-query matching
   - Coverage: Key aspects covered
   - Diversity: Variety without redundancy
   - Ranking Quality: Best chunks ranked higher
3. **Scoring**: 1-5 scale with detailed explanations
4. **Summary**: Overall assessment and recommendations

## 🔄 Advanced Reranking Guide

### Understanding Reranking Methods

1. **No Reranking** 🎯
   - Pure similarity-based ranking
   - Fast and consistent
   - Good baseline for comparison

2. **BM25 Hybrid** 🔍
   - Combines semantic similarity + keyword matching
   - Balanced approach, proven effective
   - Good for queries with specific terms

3. **Cross-Encoder** 🧠
   - Deep query-document interaction
   - Highest accuracy but slower
   - Best for complex queries

4. **Diversity Reranking** 🌈
   - Reduces redundant results
   - Promotes variety in retrieved chunks
   - Good for broad exploratory queries

5. **Length Optimization** 📏
   - Prefers chunks of optimal length (~150 words)
   - Better readability and processing
   - Good for consistent chunk sizes

6. **Keyword Boosting** 🎯
   - Boosts exact keyword matches
   - Interpretable and user-intent focused
   - Good for specific factual queries

### Reranking Best Practices

**For Different Query Types:**
- **Factual Questions**: Use Keyword Boosting or BM25 Hybrid
- **Conceptual Questions**: Use Cross-Encoder or No Reranking
- **Broad Exploration**: Use Diversity Reranking
- **Consistent Output**: Use Length Optimization

**Interpreting Results:**
- Look for rank changes: "was #3, now #1"
- Compare similarity vs combined scores
- Check method-specific scores (BM25, keyword, etc.)
- Use comparison view to see differences

## ⚖️ Evaluation System Guide

### When to Use Each Evaluation

**End-to-End RAG Evaluation:**
- After generating a complete response
- Want to assess overall pipeline quality
- Need to check for hallucinations
- Comparing different RAG configurations

**Retrieval-Only Evaluation:**
- Testing different reranking methods
- Optimizing chunk retrieval before generation
- Faster evaluation without generation step
- Focusing on information retrieval quality

### Understanding Evaluation Scores

**Score Ranges:**
- **5/5**: Excellent - Meets all criteria perfectly
- **4/5**: Good - Minor areas for improvement
- **3/5**: Average - Adequate but noticeable gaps
- **2/5**: Below Average - Significant issues
- **1/5**: Poor - Major problems, needs attention

**Evaluation Criteria:**
- **Relevance**: Direct relationship to query
- **Completeness**: Sufficient information coverage
- **Quality**: Accuracy, clarity, coherence
- **Faithfulness**: No hallucinations or contradictions
- **Coverage**: Key aspects addressed
- **Diversity**: Variety without redundancy
- **Ranking**: Most relevant items ranked higher

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

**1. "Port already in use" Error**
```bash
# Kill existing processes
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9

# Or use the script's cleanup
pkill -f "npm.*dev"
pkill -f "python.*app.py"
```

**2. "Bedrock not available" Error**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Verify .env file
cat python_backend/.env
```

**3. Python Dependencies Issues**
```bash
# Clean Python environment
rm -rf python_backend/venv_clean
python3 -m venv python_backend/venv_clean
source python_backend/venv_clean/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r python_backend/requirements.txt
```

**4. Frontend Won't Start**
```bash
# Clean node modules
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**5. NLTK Data Missing**
```bash
# Download NLTK data manually
python3 -c "
import nltk
nltk.download('punkt')
nltk.download('stopwords')
print('NLTK data downloaded successfully')
"
```

**6. Evaluation Not Working**
- Ensure you have completed phases 1-4 first
- Check that AWS Bedrock is accessible
- Verify Claude 3 model access in your region
- Try with a simpler query first

### Verification Commands

```bash
# System check
node --version && python3 --version && npm --version

# Service check
curl -s http://localhost:5000/health | jq '.'
curl -s http://localhost:5000/api/bedrock/status | jq '.bedrock_available'

# Feature tests
./test-all-reranking.sh
./test-evaluation.sh

# Manual API test
curl -X POST http://localhost:5000/api/search-chunks \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "top_k": 3, "similarity_metric": "cosine", "reranking_method": "bm25"}' \
  | jq '.success'
```

## 🎉 Success Indicators

You'll know everything is working when:

- [ ] ✅ Both services start without errors
- [ ] ✅ Frontend loads at http://localhost:3000
- [ ] ✅ Backend responds at http://localhost:5000/health
- [ ] ✅ AWS Bedrock status shows `"bedrock_available": true`
- [ ] ✅ Document processing creates chunks with embeddings
- [ ] ✅ Search returns results with similarity scores
- [ ] ✅ Reranking changes result order and shows additional scores
- [ ] ✅ Response generation produces coherent answers
- [ ] ✅ Evaluation provides detailed scores and explanations
- [ ] ✅ Test scripts run successfully

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** in the terminal running `./run-rag-app.sh`
2. **Run the test scripts** to isolate the problem
3. **Verify AWS credentials** and Bedrock access
4. **Check system requirements** and dependencies
5. **Try the manual setup** if the script fails
6. **Review the troubleshooting section** above

The application includes comprehensive error handling and helpful error messages to guide you through any issues.

---

**🎉 Ready to explore advanced RAG systems? Run `./run-rag-app.sh` and visit http://localhost:3000!**