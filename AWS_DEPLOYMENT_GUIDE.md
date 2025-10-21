# 🚀 AWS Deployment Guide - RAG Pipeline Educator

This guide shows you how to deploy the RAG Pipeline Educator on AWS using multiple deployment options, from simple EC2 instances to fully managed services.

## 🎯 Deployment Options Overview

| Method | Complexity | Cost | Scalability | Best For |
|--------|------------|------|-------------|----------|
| **EC2 Instance** | Low | $ | Manual | Development, Testing |
| **ECS Fargate** | Medium | $$ | Auto | Production, Teams |
| **App Runner** | Low | $$ | Auto | Quick Production |
| **Lambda + API Gateway** | High | $ | Serverless | Cost-Optimized |
| **EKS** | High | $$$ | Enterprise | Large Scale |

## 🚀 Option 1: EC2 Instance (Recommended for Getting Started)

### Prerequisites
- AWS Account with Bedrock access
- EC2 key pair
- Basic AWS CLI knowledge

### Step 1: Launch EC2 Instance

```bash
# Create security group
aws ec2 create-security-group \
    --group-name rag-pipeline-sg \
    --description "Security group for RAG Pipeline Educator"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-name rag-pipeline-sg \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name rag-pipeline-sg \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name rag-pipeline-sg \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-groups rag-pipeline-sg \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RAG-Pipeline-Educator}]'
```

### Step 2: Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Python 3.9+
sudo yum install -y python3 python3-pip python3-devel

# Install Git
sudo yum install -y git

# Clone repository
git clone https://github.com/your-username/rag-pipeline-educator.git
cd rag-pipeline-educator
```

### Step 3: Configure AWS Credentials

```bash
# Option 1: Use IAM Role (Recommended)
# Attach IAM role with Bedrock permissions to EC2 instance

# Option 2: Configure credentials
aws configure
# Enter your Access Key, Secret Key, Region (us-east-1)

# Option 3: Environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

### Step 4: Deploy Application

```bash
# Make startup script executable
chmod +x run-rag-app.sh

# Run setup (will install dependencies and start services)
./run-rag-app.sh
```

### Step 5: Access Application

- **Frontend**: http://your-instance-ip:3000
- **Backend API**: http://your-instance-ip:5000

### Step 6: Keep Services Running (Production)

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'rag-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ec2-user/rag-pipeline-educator',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'rag-backend',
      script: 'python3',
      args: 'app.py',
      cwd: '/home/ec2-user/rag-pipeline-educator/python_backend',
      interpreter: '/home/ec2-user/rag-pipeline-educator/python_backend/venv_clean/bin/python',
      env: {
        FLASK_ENV: 'production',
        AWS_REGION: 'us-east-1'
      }
    }
  ]
};
EOF

# Start services with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🐳 Option 2: ECS Fargate (Production Ready)

### Step 1: Create Dockerfiles

**Frontend Dockerfile:**
```dockerfile
# frontend.Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

**Backend Dockerfile:**
```dockerfile
# backend.Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY python_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Copy application code
COPY python_backend/ .

EXPOSE 5000
CMD ["python", "app.py"]
```

### Step 2: Build and Push to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name rag-pipeline-frontend
aws ecr create-repository --repository-name rag-pipeline-backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Build and push frontend
docker build -f frontend.Dockerfile -t rag-pipeline-frontend .
docker tag rag-pipeline-frontend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-frontend:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-frontend:latest

# Build and push backend
docker build -f backend.Dockerfile -t rag-pipeline-backend .
docker tag rag-pipeline-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-backend:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-backend:latest
```

### Step 3: Create ECS Task Definition

```json
{
  "family": "rag-pipeline-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::your-account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::your-account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VITE_BACKEND_URL",
          "value": "http://localhost:5000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rag-pipeline",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    },
    {
      "name": "backend",
      "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/rag-pipeline-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        },
        {
          "name": "FLASK_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rag-pipeline",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

### Step 4: Create ECS Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name rag-pipeline-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
    --cluster rag-pipeline-cluster \
    --service-name rag-pipeline-service \
    --task-definition rag-pipeline-task:1 \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## ☁️ Option 3: AWS App Runner (Simplest)

### Step 1: Create apprunner.yaml

```yaml
version: 1.0
runtime: python3
build:
  commands:
    build:
      - echo "Installing dependencies..."
      - cd python_backend
      - pip install -r requirements.txt
      - python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
      - cd ..
      - npm install
      - npm run build
run:
  runtime-version: 3.9
  command: python python_backend/app.py
  network:
    port: 5000
  env:
    - name: AWS_REGION
      value: us-east-1
    - name: FLASK_ENV
      value: production
```

### Step 2: Deploy with App Runner

```bash
# Create App Runner service
aws apprunner create-service \
    --service-name rag-pipeline-educator \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "public.ecr.aws/lambda/python:3.9",
            "ImageConfiguration": {
                "Port": "5000"
            },
            "ImageRepositoryType": "ECR_PUBLIC"
        },
        "AutoDeploymentsEnabled": true
    }' \
    --instance-configuration '{
        "Cpu": "1024",
        "Memory": "2048"
    }'
```

## 🔧 Option 4: Lambda + API Gateway (Serverless)

### Step 1: Create Lambda Deployment Package

```bash
# Create deployment directory
mkdir lambda-deployment
cd lambda-deployment

# Copy backend code
cp -r ../python_backend/* .

# Install dependencies
pip install -r requirements.txt -t .

# Create Lambda handler
cat > lambda_handler.py << 'EOF'
import json
from app import app

def lambda_handler(event, context):
    # Convert API Gateway event to Flask request
    from werkzeug.serving import WSGIRequestHandler
    from werkzeug.test import Client
    
    client = Client(app)
    
    # Extract request details from event
    method = event['httpMethod']
    path = event['path']
    headers = event.get('headers', {})
    body = event.get('body', '')
    
    # Make request to Flask app
    response = client.open(
        path=path,
        method=method,
        headers=headers,
        data=body
    )
    
    return {
        'statusCode': response.status_code,
        'headers': dict(response.headers),
        'body': response.get_data(as_text=True)
    }
EOF

# Create deployment package
zip -r ../rag-pipeline-lambda.zip .
```

### Step 2: Deploy Lambda Function

```bash
# Create Lambda function
aws lambda create-function \
    --function-name rag-pipeline-backend \
    --runtime python3.9 \
    --role arn:aws:iam::your-account:role/lambda-execution-role \
    --handler lambda_handler.lambda_handler \
    --zip-file fileb://rag-pipeline-lambda.zip \
    --timeout 300 \
    --memory-size 1024 \
    --environment Variables='{AWS_REGION=us-east-1}'
```

### Step 3: Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api --name rag-pipeline-api

# Create resources and methods (detailed steps omitted for brevity)
# Configure Lambda integration
# Deploy API
```

## 🌐 Option 5: CloudFormation Template (Infrastructure as Code)

### Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'RAG Pipeline Educator - Complete Infrastructure'

Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: RAG-Pipeline-VPC

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: RAG-Pipeline-Public-Subnet

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: RAG-Pipeline-IGW

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: RAG-Pipeline-Public-RT

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # Security Group
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RAG Pipeline Educator
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 5000
          ToPort: 5000
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: RAG-Pipeline-SG

  # IAM Role for EC2
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonBedrockFullAccess
      Tags:
        - Key: Name
          Value: RAG-Pipeline-EC2-Role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2
      InstanceType: t3.medium
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          
          # Install Node.js 18
          curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
          yum install -y nodejs
          
          # Install Python 3.9
          yum install -y python3 python3-pip python3-devel gcc
          
          # Install Git
          yum install -y git
          
          # Clone repository
          cd /home/ec2-user
          git clone https://github.com/your-username/rag-pipeline-educator.git
          chown -R ec2-user:ec2-user rag-pipeline-educator
          
          # Setup application
          cd rag-pipeline-educator
          sudo -u ec2-user ./run-rag-app.sh
      Tags:
        - Key: Name
          Value: RAG-Pipeline-Educator

Outputs:
  InstancePublicIP:
    Description: Public IP address of the EC2 instance
    Value: !GetAtt EC2Instance.PublicIp
    
  FrontendURL:
    Description: URL to access the frontend application
    Value: !Sub 'http://${EC2Instance.PublicIp}:3000'
    
  BackendURL:
    Description: URL to access the backend API
    Value: !Sub 'http://${EC2Instance.PublicIp}:5000'
```

### Deploy with CloudFormation

```bash
# Deploy the stack
aws cloudformation create-stack \
    --stack-name rag-pipeline-educator \
    --template-body file://cloudformation-template.yaml \
    --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    --capabilities CAPABILITY_IAM

# Get outputs
aws cloudformation describe-stacks \
    --stack-name rag-pipeline-educator \
    --query 'Stacks[0].Outputs'
```

## 🔒 Security Best Practices

### 1. IAM Roles and Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Network Security

- Use VPC with private subnets for production
- Implement Application Load Balancer with SSL/TLS
- Configure WAF for web application firewall
- Use Security Groups with least privilege

### 3. Environment Variables

```bash
# Never hardcode credentials
export AWS_REGION=us-east-1
# Use IAM roles instead of access keys when possible
```

## 📊 Monitoring and Logging

### CloudWatch Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /aws/rag-pipeline

# Install CloudWatch agent on EC2
sudo yum install -y amazon-cloudwatch-agent
```

### Application Monitoring

```python
# Add to your Flask app
import boto3
import logging

# Configure CloudWatch logging
cloudwatch = boto3.client('logs')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add custom metrics
def log_rag_metrics(query, response_time, evaluation_score):
    logger.info(f"RAG Query: {query}, Response Time: {response_time}s, Score: {evaluation_score}")
```

## 💰 Cost Optimization

### 1. Instance Sizing
- **Development**: t3.small ($15/month)
- **Production**: t3.medium ($30/month)
- **High Traffic**: c5.large ($60/month)

### 2. Bedrock Costs
- **Titan Embeddings**: $0.0001 per 1K tokens
- **Claude 3 Haiku**: $0.00025 per 1K input tokens
- **Estimated Monthly**: $10-50 for moderate usage

### 3. Auto Scaling
```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name rag-pipeline-asg \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1 \
    --target-group-arns arn:aws:elasticloadbalancing:region:account:targetgroup/rag-pipeline/1234567890123456
```

## 🚀 Quick Start Commands

### Deploy on EC2 (5 minutes)
```bash
# 1. Launch instance with CloudFormation
aws cloudformation create-stack \
    --stack-name rag-pipeline \
    --template-body file://cloudformation-template.yaml \
    --parameters ParameterKey=KeyPairName,ParameterValue=your-key

# 2. Get instance IP
INSTANCE_IP=$(aws cloudformation describe-stacks \
    --stack-name rag-pipeline \
    --query 'Stacks[0].Outputs[?OutputKey==`InstancePublicIP`].OutputValue' \
    --output text)

# 3. Access application
echo "Frontend: http://$INSTANCE_IP:3000"
echo "Backend: http://$INSTANCE_IP:5000"
```

### Deploy with Docker (Local Testing)
```bash
# Build and run with Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: backend.Dockerfile
    ports:
      - "5000:5000"
    environment:
      - AWS_REGION=us-east-1
  
  frontend:
    build:
      context: .
      dockerfile: frontend.Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_BACKEND_URL=http://localhost:5000
EOF

docker-compose up -d
```

## 🆘 Troubleshooting AWS Deployment

### Common Issues

1. **Bedrock Access Denied**
   ```bash
   # Check IAM permissions
   aws iam simulate-principal-policy \
       --policy-source-arn arn:aws:iam::account:role/your-role \
       --action-names bedrock:InvokeModel \
       --resource-arns "*"
   ```

2. **Port Access Issues**
   ```bash
   # Check security group rules
   aws ec2 describe-security-groups --group-names rag-pipeline-sg
   ```

3. **Instance Not Accessible**
   ```bash
   # Check instance status
   aws ec2 describe-instances --filters "Name=tag:Name,Values=RAG-Pipeline-Educator"
   ```

### Health Checks
```bash
# Test deployment
curl http://your-instance-ip:5000/health
curl http://your-instance-ip:5000/api/bedrock/status
```

---

**🎉 Ready to deploy on AWS? Choose your preferred method and follow the guide above!**

For questions or issues, check the troubleshooting section or refer to the main [README.md](README.md) for local development setup.