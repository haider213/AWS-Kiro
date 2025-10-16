# AWS Setup Guide for RAG Pipeline Educator

This guide helps you configure AWS services for the RAG Pipeline Educator hackathon deployment.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Access to AWS Bedrock service in your region

## AWS Bedrock Setup

### 1. Enable Bedrock Models

You need to request access to the following models in the AWS Bedrock console:

**Embedding Models:**
- `amazon.titan-embed-text-v1` - Primary embedding model
- `cohere.embed-english-v3` - Alternative for English text
- `cohere.embed-multilingual-v3` - For multilingual support

**Generation Models:**
- `anthropic.claude-3-sonnet-20240229-v1:0` - High-quality responses
- `anthropic.claude-3-haiku-20240307-v1:0` - Fast responses
- `amazon.titan-text-premier-v1:0` - Alternative generation

### 2. Request Model Access

1. Go to AWS Bedrock Console
2. Navigate to "Model access" in the left sidebar
3. Click "Request model access"
4. Select the models listed above
5. Submit the request (approval is usually instant for most models)

### 3. Supported Regions

Bedrock is available in these regions (choose one):
- `us-east-1` (N. Virginia) - Recommended for hackathons
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)

## Authentication Options

### Option 1: IAM Roles (Recommended for Production)

Create an IAM role with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1",
                "arn:aws:bedrock:*::foundation-model/cohere.embed-english-v3",
                "arn:aws:bedrock:*::foundation-model/cohere.embed-multilingual-v3",
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                "arn:aws:bedrock:*::foundation-model/amazon.titan-text-premier-v1:0"
            ]
        }
    ]
}
```

### Option 2: Access Keys (For Development/Hackathons)

1. Create an IAM user with the policy above
2. Generate access keys
3. Add to your environment files

### Option 3: AWS Profiles

Configure AWS CLI with a profile:
```bash
aws configure --profile rag-educator
```

## Environment Configuration

Update your environment files with your AWS details:

### Backend Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Or use AWS Profile instead of keys
# AWS_PROFILE=rag-educator

# Bedrock Configuration
BEDROCK_REGION=us-east-1
```

## Deployment Options

### Option 1: AWS EC2

1. Launch an EC2 instance (t3.medium recommended)
2. Install Node.js and Docker
3. Use the provided Dockerfile for deployment
4. Configure security groups for port 3001

### Option 2: AWS ECS/Fargate

1. Build and push Docker image to ECR
2. Create ECS task definition
3. Deploy as Fargate service
4. Configure load balancer

### Option 3: AWS Lambda (Serverless)

For serverless deployment, you'll need to modify the Express app to work with Lambda. This requires additional configuration not covered in this basic setup.

## Cost Optimization for Hackathons

### Bedrock Pricing (Approximate)

**Embedding Models:**
- Titan Embed: $0.0001 per 1K tokens
- Cohere Embed: $0.0001 per 1K tokens

**Generation Models:**
- Claude 3 Haiku: $0.00025 per 1K input tokens, $0.00125 per 1K output tokens
- Claude 3 Sonnet: $0.003 per 1K input tokens, $0.015 per 1K output tokens

### Cost Control Measures

1. **Rate Limiting**: Already configured in the application
2. **Caching**: Responses are cached to reduce API calls
3. **Request Batching**: Multiple chunks processed together
4. **Model Selection**: Use Haiku for demos, Sonnet for quality comparisons

### Estimated Hackathon Costs

For a 48-hour hackathon with 50 active users:
- Embedding costs: ~$5-10
- Generation costs: ~$20-50
- Total estimated cost: ~$25-60

## Testing Your Setup

1. **Test AWS Credentials:**
```bash
aws bedrock list-foundation-models --region us-east-1
```

2. **Test Backend Health:**
```bash
curl http://your-backend-url/health
```

3. **Test Bedrock Integration:**
```bash
curl -X POST http://your-backend-url/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello world"]}'
```

## Troubleshooting

### Common Issues

1. **Model Access Denied**: Ensure you've requested access to all required models
2. **Region Mismatch**: Verify AWS_REGION and BEDROCK_REGION match
3. **Credentials Error**: Check AWS credentials are properly configured
4. **Rate Limiting**: Bedrock has default quotas that may need adjustment

### Support Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when possible instead of access keys
3. **Implement proper rate limiting** to prevent abuse
4. **Monitor usage** through AWS CloudWatch
5. **Set up billing alerts** to avoid unexpected charges

## Quick Start Commands

```bash
# 1. Configure AWS credentials
aws configure

# 2. Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# 3. Update environment files with your AWS details
cp backend/.env.example backend/.env.production
# Edit backend/.env.production with your AWS details

# 4. Deploy
./deploy.ps1 -Environment production
```