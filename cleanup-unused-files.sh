#!/bin/bash

# Cleanup script to remove unused files from the RAG Pipeline Educator project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}RAG Pipeline Cleanup Script${NC}"
echo -e "${BLUE}================================${NC}"

# Remove unused virtual environments
print_status "Cleaning up old virtual environments..."

if [ -d "python_backend/venv" ]; then
    rm -rf python_backend/venv
    print_success "Removed python_backend/venv"
fi

if [ -d "python_backend/.venv" ]; then
    rm -rf python_backend/.venv
    print_success "Removed python_backend/.venv"
fi

# Remove node_modules if they exist (will be reinstalled by startup script)
print_status "Cleaning up node_modules directories..."

if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "Removed root node_modules"
fi

if [ -d "backend/node_modules" ]; then
    rm -rf backend/node_modules
    print_success "Removed backend/node_modules"
fi

# Remove package-lock files (will be regenerated)
print_status "Cleaning up lock files..."

if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_success "Removed root package-lock.json"
fi

if [ -f "backend/package-lock.json" ]; then
    rm backend/package-lock.json
    print_success "Removed backend/package-lock.json"
fi

# Remove build directories
print_status "Cleaning up build directories..."

if [ -d "dist" ]; then
    rm -rf dist
    print_success "Removed dist directory"
fi

if [ -d "backend/dist" ]; then
    rm -rf backend/dist
    print_success "Removed backend/dist directory"
fi

# Remove log files
print_status "Cleaning up log files..."

find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true

# Remove OS-specific files
print_status "Cleaning up OS-specific files..."

find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true

# Remove temporary files
print_status "Cleaning up temporary files..."

find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.temp" -type f -delete 2>/dev/null || true

# Remove Python cache
print_status "Cleaning up Python cache..."

find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -type f -delete 2>/dev/null || true
find . -name "*.pyo" -type f -delete 2>/dev/null || true

print_success "Cleanup completed successfully!"
print_status "You can now run ./start-rag-pipeline.sh to start the application"