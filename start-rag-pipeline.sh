#!/bin/bash

# RAG Pipeline Educator - Complete Startup Script
# This script sets up and starts all components of the RAG Pipeline Educator

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
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
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
    fi
    
    if [ ! -z "$PYTHON_PID" ]; then
        print_status "Stopping Python backend (PID: $PYTHON_PID)..."
        kill $PYTHON_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$NODE_PID" ]; then
        print_status "Stopping Node.js backend (PID: $NODE_PID)..."
        kill $NODE_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on our ports
    for port in 3000 3001 5000; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            print_status "Killing process on port $port (PID: $pid)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    print_success "Cleanup completed"
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM EXIT

# Main execution starts here
print_header "RAG Pipeline Educator Startup"

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

for port in 3000 3001 5000; do
    if ! check_port $port; then
        print_error "Port $port is already in use. Please stop the service using this port and try again."
        print_status "You can find the process using: lsof -i :$port"
        exit 1
    fi
done

print_success "All required ports (3000, 3001, 5000) are available"

# Setup Python Backend
print_header "Setting Up Python Backend"

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
    pip install flask flask-cors numpy pandas scikit-learn nltk requests python-dotenv boto3 > /dev/null 2>&1
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
PYTHON_PID=$!
cd ..

# Setup Node.js Backend
print_header "Setting Up Node.js Backend"

cd backend

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
    print_success "Node.js dependencies installed"
fi

# Check if we can start the backend
print_status "Starting Node.js backend on port 3001..."

# Try different approaches for starting the backend
if npm run dev > /dev/null 2>&1 &
then
    NODE_PID=$!
    print_success "Node.js backend started with npm run dev"
elif npx tsx src/server.ts > /dev/null 2>&1 &
then
    NODE_PID=$!
    print_success "Node.js backend started with tsx"
elif node --loader tsx/esm src/server.ts > /dev/null 2>&1 &
then
    NODE_PID=$!
    print_success "Node.js backend started with node loader"
else
    print_warning "Node.js backend failed to start. Some features may not work."
    print_warning "You can manually start it later with: cd backend && npm run dev"
fi

cd ..

# Setup Frontend
print_header "Setting Up Frontend"

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
print_header "Verifying Services"

# Wait for Python backend
wait_for_service "http://localhost:5000/health" "Python Backend"

# Wait for frontend
wait_for_service "http://localhost:3000" "Frontend"

# Check Node.js backend (optional)
if [ ! -z "$NODE_PID" ]; then
    if wait_for_service "http://localhost:3001/health" "Node.js Backend"; then
        print_success "Node.js backend is ready"
    else
        print_warning "Node.js backend may not be fully ready, but continuing..."
    fi
fi

# Display success message
print_header "🚀 RAG Pipeline Educator is Ready!"

echo ""
echo -e "${GREEN}✅ All services are running:${NC}"
echo -e "   ${CYAN}🌐 Frontend:${NC}        http://localhost:3000"
echo -e "   ${CYAN}🐍 Python Backend:${NC}  http://localhost:5000"
if [ ! -z "$NODE_PID" ]; then
    echo -e "   ${CYAN}📊 Node.js Backend:${NC} http://localhost:3001"
fi
echo ""
echo -e "${YELLOW}📚 Features Available:${NC}"
echo -e "   • Document Chunking with multiple strategies"
echo -e "   • Vector Embeddings visualization"
echo -e "   • Information Retrieval with similarity metrics"
echo -e "   • Response Generation with Bedrock models"
echo ""
echo -e "${BLUE}💡 Usage Tips:${NC}"
echo -e "   • Start with the Chunking phase to process documents"
echo -e "   • Navigate between phases using the top navigation"
echo -e "   • Experiment with different parameters to see their effects"
echo -e "   • Use sample queries to test the retrieval system"
echo ""
echo -e "${RED}🛑 To stop all services:${NC} Press Ctrl+C"
echo ""

# Keep the script running and wait for user interrupt
print_status "Services are running. Press Ctrl+C to stop all services."

# Wait for all background processes
wait