#!/bin/bash

# Docker User Data Script for EC2 Instance
# This script sets up Docker and deploys the RAG Pipeline Educator

yum update -y

# Install Docker
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /home/ec2-user
git clone https://github.com/your-username/rag-pipeline-educator.git
chown -R ec2-user:ec2-user rag-pipeline-educator

# Setup environment
cd rag-pipeline-educator
echo "AWS_REGION=us-east-1" > python_backend/.env
echo "FLASK_ENV=production" >> python_backend/.env

# Start services with Docker Compose
sudo -u ec2-user docker-compose up -d

# Wait for services to be ready
sleep 60

# Verify deployment
curl -f http://localhost:5000/health || echo "Health check failed"