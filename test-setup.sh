#!/bin/bash

# Quick test script to verify the RAG Pipeline setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}RAG Pipeline Setup Test${NC}"
echo -e "${BLUE}================================${NC}"

# Test system requirements
print_status "Checking system requirements..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found"
    exit 1
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 not found"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Test file structure
print_status "Checking project structure..."

required_files=(
    "package.json"
    "src/SimpleApp.tsx"
    "src/components/ComprehensiveRAGPipeline.tsx"
    "backend/package.json"
    "python_backend/app.py"
    "python_backend/requirements.txt"
    "start-rag-pipeline.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

# Test script permissions
print_status "Checking script permissions..."

if [ -x "start-rag-pipeline.sh" ]; then
    print_success "start-rag-pipeline.sh is executable"
else
    print_error "start-rag-pipeline.sh is not executable"
    chmod +x start-rag-pipeline.sh
    print_success "Fixed: Made start-rag-pipeline.sh executable"
fi

if [ -x "cleanup-unused-files.sh" ]; then
    print_success "cleanup-unused-files.sh is executable"
else
    print_error "cleanup-unused-files.sh is not executable"
    chmod +x cleanup-unused-files.sh
    print_success "Fixed: Made cleanup-unused-files.sh executable"
fi

# Test port availability
print_status "Checking port availability..."

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

for port in 3000 3001 5000; do
    if check_port $port; then
        print_success "Port $port is available"
    else
        print_error "Port $port is in use"
        print_status "Process using port $port:"
        lsof -i :$port || true
    fi
done

echo ""
echo -e "${GREEN}✅ Setup test completed!${NC}"
echo -e "${BLUE}💡 To start the application, run:${NC} ./start-rag-pipeline.sh"
echo ""