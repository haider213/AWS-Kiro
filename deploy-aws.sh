#!/bin/bash

# AWS Deployment Script for RAG Pipeline Educator
# This script provides multiple deployment options for AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        echo "Install with: pip install awscli"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Some features may not work properly."
        echo "Install with: sudo apt-get install jq (Ubuntu) or brew install jq (macOS)"
    fi
    
    print_success "Prerequisites check passed"
}

# Deploy with CloudFormation
deploy_cloudformation() {
    print_header "🚀 Deploying with CloudFormation"
    
    # Get parameters
    read -p "Enter your EC2 Key Pair name: " KEY_PAIR
    read -p "Enter instance type (default: t3.medium): " INSTANCE_TYPE
    INSTANCE_TYPE=${INSTANCE_TYPE:-t3.medium}
    
    read -p "Enter GitHub repository URL (default: current repo): " GITHUB_REPO
    GITHUB_REPO=${GITHUB_REPO:-https://github.com/your-username/rag-pipeline-educator.git}
    
    STACK_NAME="rag-pipeline-educator-$(date +%s)"
    
    print_info "Deploying CloudFormation stack: $STACK_NAME"
    
    # Deploy stack
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation-template.yaml \
        --parameters \
            ParameterKey=KeyPairName,ParameterValue="$KEY_PAIR" \
            ParameterKey=InstanceType,ParameterValue="$INSTANCE_TYPE" \
            ParameterKey=GitHubRepo,ParameterValue="$GITHUB_REPO" \
        --capabilities CAPABILITY_IAM \
        --tags Key=Project,Value=RAG-Pipeline-Educator
    
    print_info "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
    
    # Get outputs
    print_success "Stack created successfully!"
    echo ""
    echo "Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    # Get URLs
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' \
        --output text)
    
    BACKEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
        --output text)
    
    echo ""
    print_success "Deployment completed!"
    echo -e "${CYAN}Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${CYAN}Backend URL:${NC} $BACKEND_URL"
    echo -e "${CYAN}Demo Page:${NC} $FRONTEND_URL/test-reranking.html"
}

# Deploy with Docker on EC2
deploy_docker_ec2() {
    print_header "🐳 Deploying with Docker on EC2"
    
    print_info "This will launch an EC2 instance and deploy using Docker Compose"
    
    # Create security group
    SG_ID=$(aws ec2 create-security-group \
        --group-name rag-pipeline-docker-sg \
        --description "Security group for RAG Pipeline Docker deployment" \
        --query 'GroupId' --output text)
    
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5000 --cidr 0.0.0.0/0
    
    # Get parameters
    read -p "Enter your EC2 Key Pair name: " KEY_PAIR
    
    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id ami-0c02fb55956c7d316 \
        --count 1 \
        --instance-type t3.medium \
        --key-name "$KEY_PAIR" \
        --security-group-ids "$SG_ID" \
        --user-data file://docker-user-data.sh \
        --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RAG-Pipeline-Docker}]' \
        --query 'Instances[0].InstanceId' --output text)
    
    print_info "Instance launched: $INSTANCE_ID"
    print_info "Waiting for instance to be running..."
    
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    print_success "Instance is running!"
    echo -e "${CYAN}Public IP:${NC} $PUBLIC_IP"
    echo -e "${CYAN}SSH Command:${NC} ssh -i $KEY_PAIR.pem ec2-user@$PUBLIC_IP"
    echo ""
    print_info "Waiting for application to start (this may take 5-10 minutes)..."
    echo -e "${CYAN}Frontend URL:${NC} http://$PUBLIC_IP:3000"
    echo -e "${CYAN}Backend URL:${NC} http://$PUBLIC_IP:5000"
}

# Test deployment
test_deployment() {
    print_header "🧪 Testing Deployment"
    
    read -p "Enter the backend URL (e.g., http://your-ip:5000): " BACKEND_URL
    
    print_info "Testing health endpoint..."
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        return 1
    fi
    
    print_info "Testing Bedrock status..."
    if curl -f "$BACKEND_URL/api/bedrock/status" > /dev/null 2>&1; then
        print_success "Bedrock status check passed"
    else
        print_warning "Bedrock status check failed - check AWS credentials"
    fi
    
    print_info "Testing reranking functionality..."
    RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/search-chunks" \
        -H "Content-Type: application/json" \
        -d '{"query": "test", "top_k": 3, "similarity_metric": "cosine", "reranking_method": "bm25"}')
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Reranking test passed"
    else
        print_warning "Reranking test failed - may need document processing first"
    fi
    
    print_success "Testing completed!"
}

# Cleanup resources
cleanup_resources() {
    print_header "🧹 Cleanup Resources"
    
    echo "Available CloudFormation stacks:"
    aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query 'StackSummaries[?contains(StackName, `rag-pipeline`)].{Name:StackName,Status:StackStatus,Created:CreationTime}' \
        --output table
    
    read -p "Enter stack name to delete (or press Enter to skip): " STACK_NAME
    
    if [ -n "$STACK_NAME" ]; then
        print_info "Deleting stack: $STACK_NAME"
        aws cloudformation delete-stack --stack-name "$STACK_NAME"
        print_info "Waiting for stack deletion..."
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
        print_success "Stack deleted successfully"
    fi
    
    # Cleanup security groups
    print_info "Cleaning up security groups..."
    SG_IDS=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=rag-pipeline*" \
        --query 'SecurityGroups[].GroupId' --output text)
    
    for SG_ID in $SG_IDS; do
        if [ -n "$SG_ID" ]; then
            print_info "Deleting security group: $SG_ID"
            aws ec2 delete-security-group --group-id "$SG_ID" || print_warning "Failed to delete $SG_ID"
        fi
    done
}

# Main menu
show_menu() {
    print_header "🚀 RAG Pipeline Educator - AWS Deployment"
    echo ""
    echo "Choose deployment option:"
    echo "1) CloudFormation (Recommended) - Complete infrastructure"
    echo "2) Docker on EC2 - Containerized deployment"
    echo "3) Test existing deployment"
    echo "4) Cleanup resources"
    echo "5) Exit"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    
    while true; do
        show_menu
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1)
                deploy_cloudformation
                break
                ;;
            2)
                deploy_docker_ec2
                break
                ;;
            3)
                test_deployment
                ;;
            4)
                cleanup_resources
                ;;
            5)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-5."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"