# RAG Pipeline Educator Deployment Script (PowerShell)
# This script handles deployment for different environments

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false,
    [switch]$Help = $false
)

# Function to show usage
function Show-Usage {
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Green
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Environment ENV     Set deployment environment (production|staging) [default: production]"
    Write-Host "  -SkipTests          Skip running tests"
    Write-Host "  -SkipBuild          Skip building the application"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1                    Deploy to production"
    Write-Host "  .\deploy.ps1 -Environment staging  Deploy to staging"
    Write-Host "  .\deploy.ps1 -SkipTests -SkipBuild  Skip tests and build"
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Validate environment
if ($Environment -notin @("production", "staging")) {
    Write-Host "ERROR: Invalid environment: $Environment. Must be 'production' or 'staging'" -ForegroundColor Red
    exit 1
}

Write-Host "Starting deployment for $Environment environment" -ForegroundColor Green

# Check if required files exist
if (-not (Test-Path ".env.$Environment")) {
    Write-Host "ERROR: Environment file .env.$Environment not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend\.env.$Environment")) {
    Write-Host "ERROR: Backend environment file backend\.env.$Environment not found" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Run tests
if (-not $SkipTests) {
    Write-Host "Running frontend tests..." -ForegroundColor Blue
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend tests failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Running backend tests..." -ForegroundColor Blue
    Set-Location backend
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Backend tests failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
} else {
    Write-Host "WARNING: Skipping tests" -ForegroundColor Yellow
}

# Build applications
if (-not $SkipBuild) {
    Write-Host "Building frontend for $Environment..." -ForegroundColor Blue
    if ($Environment -eq "production") {
        npm run build:prod
    } else {
        npm run build:staging
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "Building backend..." -ForegroundColor Blue
    Set-Location backend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Backend build failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
} else {
    Write-Host "WARNING: Skipping build" -ForegroundColor Yellow
}

# Copy environment files
Write-Host "Copying environment configuration..." -ForegroundColor Blue
Copy-Item ".env.$Environment" ".env" -Force
Copy-Item "backend\.env.$Environment" "backend\.env" -Force

Write-Host "Deployment preparation complete!" -ForegroundColor Green
Write-Host "Frontend build available in: .\dist" -ForegroundColor Cyan
Write-Host "Backend build available in: .\backend\dist" -ForegroundColor Cyan

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload frontend files from .\dist to your static hosting service"
Write-Host "2. Deploy backend from .\backend to your server or container platform"
Write-Host "3. Update DNS and SSL certificates if needed"
Write-Host "4. Run health checks to verify deployment"

# Show deployment-specific instructions
if ($Environment -eq "production") {
    Write-Host ""
    Write-Host "Production deployment checklist:" -ForegroundColor Yellow
    Write-Host "- Verify AWS credentials are configured"
    Write-Host "- Check rate limiting settings"
    Write-Host "- Ensure monitoring is enabled"
    Write-Host "- Test all API endpoints"
    Write-Host "- Verify CDN configuration"
}