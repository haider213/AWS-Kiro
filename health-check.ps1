# Health Check Script for RAG Pipeline Educator Deployment
# Verifies that both frontend and backend are properly deployed and functional

param(
    [string]$FrontendUrl = "http://localhost:4173",
    [string]$BackendUrl = "http://localhost:3001",
    [switch]$Production = $false,
    [switch]$Verbose = $false
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host "✓ $Message" -ForegroundColor $Color
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Cyan
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedContentType = $null
    )
    
    try {
        if ($Verbose) {
            Write-Info "Testing: $Description at $Url"
        }
        
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Status "$Description - OK (Status: $($response.StatusCode))" $Green
            
            if ($ExpectedContentType -and $response.Headers.'Content-Type' -notlike "*$ExpectedContentType*") {
                Write-Warning "$Description - Unexpected content type: $($response.Headers.'Content-Type')"
            }
            
            return $true
        } else {
            Write-Error "$Description - Unexpected status: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error "$Description - Failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-APIEndpoint {
    param(
        [string]$Url,
        [string]$Description,
        [hashtable]$Body = $null,
        [string]$Method = "GET"
    )
    
    try {
        if ($Verbose) {
            Write-Info "Testing API: $Description at $Url"
        }
        
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            TimeoutSec = 15
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Status "$Description - OK" $Green
            
            if ($Verbose -and $content) {
                Write-Info "Response: $($content | ConvertTo-Json -Compress)"
            }
            
            return $true
        } else {
            Write-Error "$Description - Status: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error "$Description - Failed: $($_.Exception.Message)"
        return $false
    }
}

Write-Host "🏥 RAG Pipeline Educator - Health Check" -ForegroundColor $Cyan
Write-Host "=======================================" -ForegroundColor $Cyan
Write-Host ""

$allPassed = $true

# Frontend Health Checks
Write-Host "🌐 Frontend Health Checks" -ForegroundColor $Yellow
Write-Host "--------------------------"

$frontendPassed = Test-Endpoint -Url $FrontendUrl -Description "Frontend Application" -ExpectedContentType "text/html"
$allPassed = $allPassed -and $frontendPassed

if ($frontendPassed) {
    # Test for critical assets
    $assetTests = @(
        @{ Path = "/assets/index.js"; Description = "Main JavaScript Bundle" },
        @{ Path = "/assets/index.css"; Description = "Main CSS Bundle" }
    )
    
    foreach ($asset in $assetTests) {
        $assetUrl = $FrontendUrl.TrimEnd('/') + $asset.Path
        $assetPassed = Test-Endpoint -Url $assetUrl -Description $asset.Description
        $allPassed = $allPassed -and $assetPassed
    }
}

Write-Host ""

# Backend Health Checks
Write-Host "🔧 Backend Health Checks" -ForegroundColor $Yellow
Write-Host "-------------------------"

$backendPassed = Test-Endpoint -Url "$BackendUrl/health" -Description "Backend Health Check" -ExpectedContentType "application/json"
$allPassed = $allPassed -and $backendPassed

if ($backendPassed) {
    # Test API endpoints
    $apiTests = @(
        @{ Url = "$BackendUrl/api"; Description = "API Info Endpoint" },
        @{ Url = "$BackendUrl/api/models/embedding"; Description = "Embedding Models Endpoint" },
        @{ Url = "$BackendUrl/api/models/generation"; Description = "Generation Models Endpoint" },
        @{ Url = "$BackendUrl/api/cache/stats"; Description = "Cache Stats Endpoint" },
        @{ Url = "$BackendUrl/api/metrics"; Description = "Metrics Endpoint" }
    )
    
    foreach ($test in $apiTests) {
        $testPassed = Test-APIEndpoint -Url $test.Url -Description $test.Description
        $allPassed = $allPassed -and $testPassed
    }
    
    # Test POST endpoints with sample data
    Write-Host ""
    Write-Host "🧪 API Functionality Tests" -ForegroundColor $Yellow
    Write-Host "---------------------------"
    
    $embeddingTest = Test-APIEndpoint -Url "$BackendUrl/api/embeddings/generate" -Description "Embedding Generation" -Method "POST" -Body @{
        texts = @("Hello world", "Test embedding")
        model = "amazon.titan-embed-text-v1"
    }
    $allPassed = $allPassed -and $embeddingTest
    
    $generationTest = Test-APIEndpoint -Url "$BackendUrl/api/generation/response" -Description "Text Generation" -Method "POST" -Body @{
        prompt = "What is artificial intelligence?"
        model = "anthropic.claude-3-haiku-20240307-v1:0"
        maxTokens = 100
    }
    $allPassed = $allPassed -and $generationTest
}

Write-Host ""

# Performance Tests
Write-Host "⚡ Performance Tests" -ForegroundColor $Yellow
Write-Host "--------------------"

if ($frontendPassed) {
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 5 -UseBasicParsing
        $loadTime = (Get-Date) - $startTime
        
        if ($loadTime.TotalMilliseconds -lt 3000) {
            Write-Status "Frontend Load Time: $($loadTime.TotalMilliseconds.ToString('F0'))ms" $Green
        } elseif ($loadTime.TotalMilliseconds -lt 5000) {
            Write-Warning "Frontend Load Time: $($loadTime.TotalMilliseconds.ToString('F0'))ms (Acceptable)"
        } else {
            Write-Error "Frontend Load Time: $($loadTime.TotalMilliseconds.ToString('F0'))ms (Too Slow)"
            $allPassed = $false
        }
    }
    catch {
        Write-Error "Frontend Performance Test Failed"
        $allPassed = $false
    }
}

if ($backendPassed) {
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        $responseTime = (Get-Date) - $startTime
        
        if ($responseTime.TotalMilliseconds -lt 1000) {
            Write-Status "Backend Response Time: $($responseTime.TotalMilliseconds.ToString('F0'))ms" $Green
        } elseif ($responseTime.TotalMilliseconds -lt 2000) {
            Write-Warning "Backend Response Time: $($responseTime.TotalMilliseconds.ToString('F0'))ms (Acceptable)"
        } else {
            Write-Error "Backend Response Time: $($responseTime.TotalMilliseconds.ToString('F0'))ms (Too Slow)"
            $allPassed = $false
        }
    }
    catch {
        Write-Error "Backend Performance Test Failed"
        $allPassed = $false
    }
}

Write-Host ""

# Security Tests (Production only)
if ($Production) {
    Write-Host "🔒 Security Tests" -ForegroundColor $Yellow
    Write-Host "-----------------"
    
    # Test HTTPS
    if ($FrontendUrl.StartsWith("https://")) {
        Write-Status "Frontend uses HTTPS" $Green
    } else {
        Write-Warning "Frontend not using HTTPS (not recommended for production)"
    }
    
    if ($BackendUrl.StartsWith("https://")) {
        Write-Status "Backend uses HTTPS" $Green
    } else {
        Write-Warning "Backend not using HTTPS (not recommended for production)"
    }
    
    # Test security headers
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        
        $securityHeaders = @(
            "X-Frame-Options",
            "X-XSS-Protection",
            "X-Content-Type-Options",
            "Referrer-Policy"
        )
        
        foreach ($header in $securityHeaders) {
            if ($response.Headers[$header]) {
                Write-Status "Security header present: $header" $Green
            } else {
                Write-Warning "Missing security header: $header"
            }
        }
    }
    catch {
        Write-Warning "Could not test security headers"
    }
}

Write-Host ""

# Summary
Write-Host "📊 Health Check Summary" -ForegroundColor $Cyan
Write-Host "========================"

if ($allPassed) {
    Write-Host "🎉 All health checks passed! Deployment is ready for hackathon usage." -ForegroundColor $Green
    Write-Host ""
    Write-Host "🚀 Deployment URLs:" -ForegroundColor $Cyan
    Write-Host "   Frontend: $FrontendUrl"
    Write-Host "   Backend:  $BackendUrl"
    Write-Host "   API Docs: $BackendUrl/api"
    Write-Host "   Health:   $BackendUrl/health"
    Write-Host "   Metrics:  $BackendUrl/api/metrics"
    
    if ($Production) {
        Write-Host ""
        Write-Host "📋 Production Checklist:" -ForegroundColor $Yellow
        Write-Host "   ✓ Application is accessible"
        Write-Host "   ✓ API endpoints are functional"
        Write-Host "   ✓ Performance is acceptable"
        Write-Host "   ⚠ Monitor AWS Bedrock usage and costs"
        Write-Host "   ⚠ Set up monitoring alerts"
        Write-Host "   ⚠ Verify SSL certificates are valid"
    }
    
    exit 0
} else {
    Write-Host "❌ Some health checks failed. Please review the issues above." -ForegroundColor $Red
    Write-Host ""
    Write-Host "🔧 Common fixes:" -ForegroundColor $Yellow
    Write-Host "   • Check if services are running"
    Write-Host "   • Verify environment variables are set correctly"
    Write-Host "   • Ensure AWS credentials are configured"
    Write-Host "   • Check firewall and network connectivity"
    Write-Host "   • Review application logs for errors"
    
    exit 1
}