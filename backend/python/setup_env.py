#!/usr/bin/env python3
"""
Setup script to copy AWS credentials from backend/.env to python/.env
"""

import os
from pathlib import Path

def setup_environment():
    """Copy AWS credentials from parent .env file."""
    
    # Paths
    backend_env = Path(__file__).parent.parent / '.env'
    python_env = Path(__file__).parent / '.env'
    
    print("🔧 Setting up Python backend environment...")
    
    if not backend_env.exists():
        print(f"❌ Backend .env file not found at: {backend_env}")
        return False
    
    # Read backend .env file
    aws_vars = {}
    try:
        with open(backend_env, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('AWS_') and '=' in line:
                    key, value = line.split('=', 1)
                    aws_vars[key] = value
    except Exception as e:
        print(f"❌ Error reading backend .env: {e}")
        return False
    
    if not aws_vars:
        print("⚠️  No AWS variables found in backend .env")
        return False
    
    # Create python .env file
    try:
        with open(python_env, 'w') as f:
            f.write("# AWS Configuration (copied from backend/.env)\n")
            for key, value in aws_vars.items():
                f.write(f"{key}={value}\n")
            
            f.write("\n# Python Backend Configuration\n")
            f.write("LOG_LEVEL=info\n")
            f.write("ENABLE_DEBUG=true\n")
            f.write("\n# Bedrock Configuration\n")
            f.write("DEFAULT_EMBEDDING_MODEL=amazon.titan-embed-text-v1\n")
            f.write("DEFAULT_LLM_MODEL=anthropic.claude-3-sonnet-20240229-v1:0\n")
            f.write("\n# Performance Settings\n")
            f.write("MAX_CHUNK_SIZE=4000\n")
            f.write("MAX_CHUNKS_PER_REQUEST=100\n")
            f.write("EMBEDDING_BATCH_SIZE=25\n")
        
        print(f"✅ Created python/.env with AWS credentials")
        print(f"📍 Location: {python_env}")
        
        # Show what was copied
        print("\n📋 Copied AWS variables:")
        for key in aws_vars:
            print(f"  - {key}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating python .env: {e}")
        return False

if __name__ == "__main__":
    success = setup_environment()
    if success:
        print("\n🚀 Environment setup complete! You can now run:")
        print("   python start.py")
    else:
        print("\n❌ Environment setup failed!")
        exit(1)