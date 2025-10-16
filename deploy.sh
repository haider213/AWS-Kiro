#!/bin/bash

# RAG Pipeline Educator Deployment Script
# This script handles deployment for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BUILD=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Set deployment environment (production|staging) [default: production]"
    echo "  -s, --skip-tests        Skip running tests"
    echo "  -b, --skip-build        Skip building the application"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      Deploy to production"
    echo "  $0 -e staging           Deploy to staging"
    echo "  $0 -s -b               Skip tests and build"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be 'production' or 'staging'"
    exit 1
fi

print_status "Starting deployment for $ENVIRONMENT environment"

# Check if required files exist
if [[ ! -f ".env.$ENVIRONMENT" ]]; then
    print_error "Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

if [[ ! -f "backend/.env.$ENVIRONMENT" ]]; then
    print_error "Backend environment file backend/.env.$ENVIRONMENT not found"
    exit 1
fi

# Install dependencies
print_status "Installing frontend dependencies..."
npm ci

print_status "Installing backend dependencies..."
cd backend
npm ci
cd ..

# Run tests
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running frontend tests..."
    npm run test

    print_status "Running backend tests..."
    cd backend
    npm run test
    cd ..
else
    print_warning "Skipping tests"
fi

# Build applications
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building frontend for $ENVIRONMENT..."
    if [[ "$ENVIRONMENT" == "production" ]]; then
        npm run build:prod
    else
        npm run build:staging
    fi

    print_status "Building backend..."
    cd backend
    npm run build
    cd ..
else
    print_warning "Skipping build"
fi

# Copy environment files
print_status "Copying environment configuration..."
cp ".env.$ENVIRONMENT" .env
cp "backend/.env.$ENVIRONMENT" backend/.env

print_status "Deployment preparation complete!"
print_status "Frontend build available in: ./dist"
print_status "Backend build available in: ./backend/dist"

echo ""
print_status "Next steps:"
echo "1. Upload frontend files from ./dist to your static hosting service"
echo "2. Deploy backend from ./backend to your server or container platform"
echo "3. Update DNS and SSL certificates if needed"
echo "4. Run health checks to verify deployment"

# Show deployment-specific instructions
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    print_warning "Production deployment checklist:"
    echo "- Verify AWS credentials are configured"
    echo "- Check rate limiting settings"
    echo "- Ensure monitoring is enabled"
    echo "- Test all API endpoints"
    echo "- Verify CDN configuration"
fi