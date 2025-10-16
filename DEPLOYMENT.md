# Deployment Guide - RAG Pipeline Educator

This guide provides step-by-step instructions for deploying the RAG Pipeline Educator for hackathon usage.

## Overview

The application consists of two main components:
- **Frontend**: React application (static files)
- **Backend**: Node.js API server with AWS Bedrock integration

## Prerequisites

- Node.js 18+ installed
- AWS account with Bedrock access (see AWS_SETUP.md)
- Domain names (optional but recommended)
- SSL certificates (for production)

## Quick Deployment

### 1. Prepare Environment

```bash
# Clone and setup
git clone <your-repo>
cd rag-pipeline-educator

# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure AWS (see AWS_SETUP.md for details)
aws configure
```

### 2. Configure Environment Variables

Copy and update environment files:

```bash
# Frontend
cp .env.example .env.production
# Edit .env.production with your settings

# Backend
cp backend/.env.example backend/.env.production
# Edit backend/.env.production with your AWS credentials
```

### 3. Deploy

```bash
# Windows
.\deploy.ps1 -Environment production

# Linux/Mac
./deploy.sh -e production
```

## Detailed Deployment Options

### Option 1: Static Hosting + Cloud Server

**Frontend (Static Hosting):**
- Netlify (recommended for hackathons)
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

**Backend (Cloud Server):**
- AWS EC2
- DigitalOcean Droplet
- Heroku
- Railway

### Option 2: Container Deployment

**Using Docker:**

```bash
# Build backend container
cd backend
docker build -t rag-educator-backend .

# Run backend
docker run -p 3001:3001 --env-file .env.production rag-educator-backend

# Frontend is served as static files
```

### Option 3: Serverless Deployment

**Frontend:** Any static hosting
**Backend:** AWS Lambda + API Gateway (requires additional configuration)

## Platform-Specific Instructions

### Netlify Deployment

1. **Connect Repository:**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your repository

2. **Configure Build:**
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Environment variables: Add your `VITE_*` variables

3. **Deploy:**
   - Netlify will automatically deploy on push to main branch

### Vercel Deployment

1. **Connect Repository:**
   - Go to Vercel dashboard
   - Import your repository

2. **Configure:**
   - Framework preset: Vite
   - Build command: `npm run build:prod`
   - Output directory: `dist`

3. **Environment Variables:**
   - Add your `VITE_*` variables in Vercel dashboard

### AWS EC2 Backend Deployment

1. **Launch Instance:**
   ```bash
   # Launch t3.medium instance with Ubuntu 22.04
   # Configure security group for port 3001
   ```

2. **Setup Server:**
   ```bash
   # SSH into instance
   ssh -i your-key.pem ubuntu@your-instance-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

3. **Deploy Application:**
   ```bash
   # Clone repository
   git clone <your-repo>
   cd rag-pipeline-educator/backend

   # Install dependencies and build
   npm ci
   npm run build

   # Configure environment
   cp .env.production .env
   # Edit .env with your AWS credentials

   # Start with PM2
   pm2 start dist/server.js --name rag-educator-backend
   pm2 startup
   pm2 save
   ```

### DigitalOcean Droplet Deployment

Similar to EC2, but with DigitalOcean-specific networking configuration.

## Environment Configuration

### Frontend Environment Variables

```bash
# .env.production
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_APP_NAME=RAG Pipeline Educator
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
```

### Backend Environment Variables

```bash
# backend/.env.production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_REGION=us-east-1

# Security
API_KEY=your_secure_api_key

# Monitoring
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## SSL/HTTPS Configuration

### For Static Hosting
- Netlify/Vercel: Automatic HTTPS
- CloudFront: Configure SSL certificate

### For Backend Server
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d your-backend-domain.com

# Configure reverse proxy (nginx)
sudo apt install nginx
# Configure nginx with SSL
```

## Monitoring and Health Checks

### Health Check Endpoints

- Frontend: `https://your-domain.com` (should load the app)
- Backend: `https://your-backend-domain.com/health`
- Metrics: `https://your-backend-domain.com/api/metrics`

### Monitoring Setup

1. **Application Monitoring:**
   ```bash
   # Check backend health
   curl https://your-backend-domain.com/health

   # Check metrics
   curl https://your-backend-domain.com/api/metrics
   ```

2. **AWS Monitoring:**
   - CloudWatch for Bedrock usage
   - Set up billing alerts
   - Monitor API quotas

3. **Server Monitoring:**
   ```bash
   # Check PM2 status
   pm2 status

   # View logs
   pm2 logs rag-educator-backend

   # Monitor resources
   htop
   ```

## Performance Optimization

### CDN Configuration

1. **CloudFront (AWS):**
   - Create distribution pointing to your S3 bucket
   - Configure caching rules for assets
   - Set up custom domain

2. **Netlify/Vercel:**
   - Automatic CDN included
   - Configure headers in netlify.toml/vercel.json

### Caching Strategy

- **Static Assets:** 1 year cache (immutable)
- **API Responses:** 1 hour cache (configurable)
- **Service Worker:** No cache (always fresh)

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Verify FRONTEND_URL in backend environment
   - Check VITE_BACKEND_URL in frontend environment

2. **AWS Bedrock Errors:**
   - Verify model access in AWS console
   - Check AWS credentials and region
   - Monitor quotas and limits

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

4. **Performance Issues:**
   - Monitor memory usage on server
   - Check AWS Bedrock quotas
   - Review caching configuration

### Debug Commands

```bash
# Check frontend build
npm run build:prod
npm run preview:prod

# Check backend build
cd backend
npm run build
npm run start:prod

# Test API endpoints
curl -X POST https://your-backend/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"]}'
```

## Rollback Procedures

### Frontend Rollback
- Netlify/Vercel: Use dashboard to rollback to previous deployment
- S3: Restore previous version of files

### Backend Rollback
```bash
# Using PM2
pm2 stop rag-educator-backend
# Deploy previous version
pm2 start rag-educator-backend
```

## Security Checklist

- [ ] AWS credentials properly configured (no hardcoded keys)
- [ ] API rate limiting enabled
- [ ] HTTPS configured for both frontend and backend
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Environment variables not exposed in frontend
- [ ] Monitoring and logging enabled
- [ ] Backup procedures in place

## Cost Monitoring

### AWS Costs
- Set up billing alerts in AWS console
- Monitor Bedrock usage in CloudWatch
- Review costs daily during hackathon

### Server Costs
- Monitor server resource usage
- Scale down after hackathon
- Set up auto-shutdown if needed

## Post-Hackathon Cleanup

```bash
# Stop services
pm2 stop all

# Remove AWS resources if temporary
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0

# Archive deployment
git tag hackathon-deployment-$(date +%Y%m%d)
git push origin --tags
```

## Support and Resources

- **Application Logs:** Check PM2 logs and browser console
- **AWS Support:** Use AWS support center for Bedrock issues
- **Community:** GitHub issues for application-specific problems

For immediate hackathon support, monitor the health endpoints and AWS CloudWatch metrics.