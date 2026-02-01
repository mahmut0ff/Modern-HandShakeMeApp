# HandShakeMe Local Development Startup Script (Windows PowerShell)
# Исправленная версия для Windows с localhost

Write-Host "🚀 Starting HandShakeMe Local Development Environment (Windows)" -ForegroundColor Blue
Write-Host "📍 Using localhost" -ForegroundColor Cyan
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

# Check if Docker is running
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

Write-Status "Checking prerequisites..."
Write-Success "Docker: ✓"
Write-Success "Node.js: $(node --version)"
Write-Success "npm: $(npm --version)"
Write-Host ""

# Check if infrastructure is running
Write-Status "Checking infrastructure services..."
$infraRunning = $true

try {
    docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev | Out-Null
    if ($LASTEXITCODE -ne 0) { $infraRunning = $false }
} catch {
    $infraRunning = $false
}

if (-not $infraRunning) {
    Write-Status "Starting infrastructure services..."
    docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start infrastructure services"
        exit 1
    }
    
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 15
} else {
    Write-Success "Infrastructure services already running"
}

# Install dependencies if needed
Write-Status "Installing dependencies..."

# Lambda dependencies
Push-Location lambda
if (!(Test-Path "node_modules")) {
    Write-Status "Installing Lambda dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Lambda dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Success "Lambda dependencies already installed"
}
Pop-Location

# Mobile dependencies
Push-Location mobile
if (!(Test-Path "node_modules")) {
    Write-Status "Installing Mobile dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Mobile dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Success "Mobile dependencies already installed"
}
Pop-Location

Write-Host ""

# Step 4: Start Lambda server
Write-Status "Starting Lambda API server..."
Push-Location lambda
$lambdaJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}
Pop-Location

# Wait for Lambda to start
Start-Sleep -Seconds 5

# Check if Lambda started successfully
$lambdaRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $lambdaRunning = $true
    }
} catch {
    # Lambda might still be starting
}

if ($lambdaRunning) {
    Write-Success "Lambda API server is running"
} else {
    Write-Warning "Lambda API server is starting..."
}

# Wait for services to stabilize
Start-Sleep -Seconds 3

Write-Host ""
Write-Success "🎉 All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs (localhost):" -ForegroundColor Yellow
Write-Host "   🔗 API Server:      http://localhost:3000" -ForegroundColor White
Write-Host "   🔌 WebSocket:       ws://localhost:3001" -ForegroundColor White
Write-Host "   🗄️  PostgreSQL:     localhost:5432" -ForegroundColor White
Write-Host "   🔴 Redis:           localhost:6379" -ForegroundColor White
Write-Host "   📦 MinIO:           http://localhost:9000" -ForegroundColor White
Write-Host "   🎛️  MinIO Console:   http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "📱 To start mobile app:" -ForegroundColor Cyan
Write-Host "   .\scripts\start-mobile-windows.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Cyan
Write-Host "   .\scripts\stop-all-windows.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🧪 To test system:" -ForegroundColor Cyan
Write-Host "   .\scripts\test-system-windows.ps1" -ForegroundColor White
Write-Host ""

# Store job IDs for cleanup
$lambdaJob.Id | Out-File -FilePath ".lambda.pid" -Encoding ASCII

Write-Success "Development environment is ready! 🚀"
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running and monitor jobs
try {
    while ($true) {
        # Check job states
        $lambdaState = (Get-Job -Id $lambdaJob.Id -ErrorAction SilentlyContinue).State
        
        if ($lambdaState -eq "Failed") {
            Write-Error "Lambda server failed!"
            Write-Host "Check logs: Get-Job -Id $($lambdaJob.Id) | Receive-Job" -ForegroundColor Yellow
            break
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    # Cleanup jobs
    Write-Status "Stopping services..."
    Stop-Job $lambdaJob -ErrorAction SilentlyContinue
    Remove-Job $lambdaJob -ErrorAction SilentlyContinue
    
    # Remove PID files
    Remove-Item ".lambda.pid" -ErrorAction SilentlyContinue
}