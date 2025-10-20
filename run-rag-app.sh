#!/bin/bash

# RAG Pipeline Educator - Application Launcher
# This script starts both frontend and backend services for the RAG Pipeline Educator

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if port is available
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 1
        else
            return 0
        fi
    else
        # Fallback if lsof is not available
        if netstat -tuln 2>/dev/null | grep -q ":$1 "; then
            return 1
        else
            return 0
        fi
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_header "Shutting Down Services"
    
    # Kill background processes
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping Python backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on our ports
    for port in 3000 5000; do
        if command -v lsof >/dev/null 2>&1; then
            local pid=$(lsof -ti:$port 2>/dev/null || true)
            if [ ! -z "$pid" ]; then
                print_status "Killing process on port $port (PID: $pid)..."
                kill -9 $pid 2>/dev/null || true
            fi
        fi
    done
    
    print_success "Cleanup completed"
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM EXIT

# Main execution starts here
print_header "🚀 RAG Pipeline Educator Launcher"

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version is $NODE_VERSION. Recommended version is 18+."
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "System requirements check passed"

# Check if ports are available
print_status "Checking port availability..."

for port in 3000 5000; do
    if ! check_port $port; then
        print_error "Port $port is already in use. Please stop the service using this port and try again."
        if command -v lsof >/dev/null 2>&1; then
            print_status "You can find the process using: lsof -i :$port"
        fi
        exit 1
    fi
done

print_success "All required ports (3000, 5000) are available"

# Setup Python Backend
print_header "🐍 Setting Up Python Backend"

cd python_backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv_clean" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv_clean
    print_success "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source venv_clean/bin/activate

# Upgrade pip and install build tools
pip install --upgrade pip setuptools wheel > /dev/null 2>&1

# Install requirements
if [ -f "requirements.txt" ]; then
    print_status "Installing from requirements.txt..."
    pip install -r requirements.txt > /dev/null 2>&1
else
    print_status "Installing individual packages..."
    pip install flask flask-cors numpy pandas scikit-learn nltk requests python-dotenv boto3 langchain-experimental langchain-community langchain-core > /dev/null 2>&1
fi

print_success "Python dependencies installed"

# Download NLTK data
print_status "Downloading NLTK data..."
python3 -c "
import nltk
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
print('NLTK data ready')
" 2>/dev/null

print_success "NLTK data downloaded"

# Start Python backend
print_status "Starting Python backend on port 5000..."
python3 app.py &
BACKEND_PID=$!
cd ..

# Setup Frontend
print_header "⚛️ Setting Up Frontend"

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
    print_success "Frontend dependencies installed"
fi

# Start frontend
print_status "Starting frontend on port 3000..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for services to be ready
print_header "🔍 Verifying Services"

# Wait for Python backend
wait_for_service "http://localhost:5000/health" "Python Backend"

# Wait for frontend
wait_for_service "http://localhost:3000" "Frontend"

# Check Bedrock status
print_status "Checking AWS Bedrock integration..."
if curl -s -f "http://localhost:5000/api/bedrock/status" > /dev/null 2>&1; then
    BEDROCK_STATUS=$(curl -s "http://localhost:5000/api/bedrock/status" | grep -o '"bedrock_available":[^,]*' | cut -d':' -f2)
    if [ "$BEDROCK_STATUS" = "true" ]; then
        print_success "AWS Bedrock integration is working"
    else
        print_warning "AWS Bedrock is not available - check your credentials"
    fi
else
    print_warning "Could not check Bedrock status"
fi

# Display success message
print_header "🎉 RAG Pipeline Educator is Ready!"

echo ""
echo -e "${GREEN}✅ All services are running successfully:${NC}"
echo -e "   ${CYAN}🌐 Frontend Application:${NC}  http://localhost:3000"
echo -e "   ${CYAN}🐍 Python Backend API:${NC}   http://localhost:5000"
echo ""
echo -e "${YELLOW}📚 Available Features:${NC}"
echo -e "   • ${GREEN}Phase 1${NC}: Document Chunking (Sentence-based, Fixed-size, Paragraph, Semantic)"
echo -e "   • ${GREEN}Phase 2${NC}: Vector Embeddings (AWS Bedrock: Titan, Cohere models)"
echo -e "   • ${GREEN}Phase 3${NC}: Information Retrieval (Multiple similarity metrics + 6 reranking methods)"
echo -e "   • ${GREEN}Phase 4${NC}: Response Generation (Claude 3, Amazon Titan models)"
echo -e "   • ${GREEN}Phase 5${NC}: LLM-as-a-Judge Evaluation (Automated RAG assessment)"
echo ""
echo -e "${BLUE}💡 Quick Start Guide:${NC}"
echo -e "   1. Open ${CYAN}http://localhost:3000${NC} in your browser"
echo -e "   2. Start with Phase 1: Process a document using sentence-based chunking"
echo -e "   3. Phase 2: Generate Bedrock embeddings automatically"
echo -e "   4. Phase 3: Search with queries and experiment with reranking methods"
echo -e "   5. Phase 4: Generate AI responses using retrieved context"
echo -e "   6. Phase 5: Evaluate pipeline performance with LLM-as-a-Judge"
echo ""
echo -e "${PURPLE}🔧 Advanced Features:${NC}"
echo -e "   • ${CYAN}6 Reranking Methods${NC}: BM25, Cross-Encoder, Diversity, Length, Keyword Boost"
echo -e "   • ${CYAN}Visual Comparisons${NC}: See rank changes and reranking effects"
echo -e "   • ${CYAN}Automated Evaluation${NC}: 4 dimensions (Relevance, Completeness, Quality, Faithfulness)"
echo -e "   • ${CYAN}Test Pages${NC}: http://localhost:3000/test-reranking.html"
echo ""
echo -e "${PURPLE}🧪 Testing Commands:${NC}"
echo -e "   • ${CYAN}Test Reranking${NC}: ./test-all-reranking.sh"
echo -e "   • ${CYAN}Test Evaluation${NC}: ./test-evaluation.sh"
echo -e "   • ${CYAN}API Health${NC}: curl http://localhost:5000/health"
echo ""
echo -e "${PURPLE}🔧 Technical Details:${NC}"
echo -e "   • Backend: Python Flask + AWS Bedrock + LangChain"
echo -e "   • Frontend: React + TypeScript + Vite + D3.js"
echo -e "   • Embeddings: 1536D (Titan v1) or 1024D (Titan v2, Cohere)"
echo -e "   • Models: Claude 3 Haiku/Sonnet, Amazon Titan Premier"
echo -e "   • Evaluation: Claude 3 as LLM Judge"
echo ""
echo -e "${RED}🛑 To stop all services:${NC} Press Ctrl+C in this terminal"
echo ""

# Keep the script running and wait for user interrupt
print_status "Services are running. Press Ctrl+C to stop all services."

# Wait for all background processes
wait