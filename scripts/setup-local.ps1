# HandShakeMe Local Development Setup Script (Windows PowerShell)
# One-time setup for local development environment

param(
    [switch]$Force
)

Write-Host "🔧 Setting up HandShakeMe Local Development Environment" -ForegroundColor Blue
Write-Host "📍 Local IP: 10.228.141.81" -ForegroundColor Cyan
Write-Host ""

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check Docker
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "Docker is installed ✓"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    Write-Host "Visit: https://docs.docker.com/desktop/install/windows/" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "Docker is running ✓"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    if ($LASTEXITCODE -ne 0) { throw }
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
        exit 1
    }
    Write-Success "Node.js $nodeVersion ✓"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ first."
    Write-Host "Visit: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "npm $npmVersion ✓"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

Write-Host ""

# Create uploads directory
Write-Status "Creating uploads directory..."
if (!(Test-Path "lambda/uploads")) {
    New-Item -ItemType Directory -Path "lambda/uploads" -Force | Out-Null
}
Write-Success "Uploads directory created"

# Pull Docker images
Write-Status "Pulling Docker images..."
docker-compose -f docker-compose.local.yml pull
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to pull Docker images"
    exit 1
}
Write-Success "Docker images pulled"

# Start infrastructure services
Write-Status "Starting infrastructure services..."
docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start infrastructure services"
    exit 1
}

# Wait for services
Write-Status "Waiting for services to start..."
Start-Sleep -Seconds 15

# Check PostgreSQL
Write-Status "Checking PostgreSQL..."
$retries = 30
do {
    try {
        docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    Write-Warning "Waiting for PostgreSQL..."
    Start-Sleep -Seconds 2
    $retries--
} while ($retries -gt 0)

if ($retries -eq 0) {
    Write-Error "PostgreSQL failed to start"
    exit 1
}
Write-Success "PostgreSQL is ready"

# Check Redis
Write-Status "Checking Redis..."
$retries = 30
do {
    try {
        docker exec handshakeme-redis redis-cli ping | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    Write-Warning "Waiting for Redis..."
    Start-Sleep -Seconds 2
    $retries--
} while ($retries -gt 0)

if ($retries -eq 0) {
    Write-Error "Redis failed to start"
    exit 1
}
Write-Success "Redis is ready"

# Check MinIO
Write-Status "Checking MinIO..."
$retries = 30
do {
    try {
        $response = Invoke-WebRequest -Uri "http://10.228.141.81:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) { break }
    } catch {}
    Write-Warning "Waiting for MinIO..."
    Start-Sleep -Seconds 2
    $retries--
} while ($retries -gt 0)

if ($retries -eq 0) {
    Write-Error "MinIO failed to start"
    exit 1
}
Write-Success "MinIO is ready"

Write-Host ""
Write-Success "🎉 Local development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🚀 Start all services:" -ForegroundColor Cyan
Write-Host "   .\scripts\start-all.ps1" -ForegroundColor White
Write-Host ""
Write-Host "2. 📱 Start mobile app (in separate terminal):" -ForegroundColor Cyan
Write-Host "   .\scripts\start-mobile.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Yellow
Write-Host "   🗄️  PostgreSQL:     10.228.141.81:5432" -ForegroundColor White
Write-Host "   🔴 Redis:           10.228.141.81:6379" -ForegroundColor White
Write-Host "   📦 MinIO:           http://10.228.141.81:9000" -ForegroundColor White
Write-Host "   🎛️  MinIO Console:   http://10.228.141.81:9001 (admin/admin)" -ForegroundColor White
Write-Host ""
Write-Success "Happy coding! 🚀"