#!/usr/bin/env python3
"""
Start script for the RAG Pipeline Educator Python Backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed."""
    try:
        import fastapi
        import langchain
        import boto3
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False

def check_aws_credentials():
    """Check if AWS credentials are configured."""
    try:
        # Load environment variables first
        from dotenv import load_dotenv
        load_dotenv()
        
        import boto3
        import os
        
        # Check if credentials are in environment variables
        access_key = os.getenv('AWS_ACCESS_KEY_ID')
        secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        
        if access_key and secret_key:
            print("✅ AWS credentials found in environment variables")
            return True
        
        # Try boto3 session
        session = boto3.Session()
        credentials = session.get_credentials()
        
        if credentials is None:
            print("⚠️  AWS credentials not found")
            print("Please configure AWS credentials using:")
            print("  - AWS CLI: aws configure")
            print("  - Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY")
            print("  - IAM roles (if running on EC2)")
            return False
        
        print("✅ AWS credentials found")
        return True
    except Exception as e:
        print(f"⚠️  Could not check AWS credentials: {e}")
        return False

def main():
    """Main function to start the backend."""
    print("🚀 Starting RAG Pipeline Educator Python Backend")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check AWS credentials (optional)
    aws_available = check_aws_credentials()
    if not aws_available:
        print("⚠️  Backend will run with limited functionality (no Bedrock)")
    
    # Set environment variables
    os.environ.setdefault('AWS_REGION', 'us-east-1')
    
    print("\n🌟 Starting FastAPI server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API documentation at: http://localhost:8001/docs")
    print("🔍 Health check at: http://localhost:8001/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the server
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()