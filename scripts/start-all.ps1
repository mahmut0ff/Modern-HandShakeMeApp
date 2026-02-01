# HandShakeMe Local Development Startup Script (Windows PowerShell)
# IP: 10.228.141.81

Write-Host "🚀 Starting HandShakeMe Local Development Environment" -ForegroundColor Blue
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

# Step 1: Start infrastructure services
Write-Status "Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check if PostgreSQL is ready
Write-Status "Checking PostgreSQL connection..."
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

# Check if Redis is ready
Write-Status "Checking Redis connection..."
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

# Check if MinIO is ready
Write-Status "Checking MinIO connection..."
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

# Step 2: Install Lambda dependencies
Write-Status "Installing Lambda dependencies..."
Push-Location lambda
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Lambda dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Warning "Lambda dependencies already installed, skipping..."
}
Pop-Location

# Step 3: Install Mobile dependencies
Write-Status "Installing Mobile app dependencies..."
Push-Location mobile
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Mobile dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Warning "Mobile dependencies already installed, skipping..."
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

Write-Host ""
Write-Success "🎉 All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Yellow
Write-Host "   🔗 API Server:      http://10.228.141.81:3000" -ForegroundColor White
Write-Host "   🔌 WebSocket:       ws://10.228.141.81:3001" -ForegroundColor White
Write-Host "   🗄️  PostgreSQL:     10.228.141.81:5432" -ForegroundColor White
Write-Host "   🔴 Redis:           10.228.141.81:6379" -ForegroundColor White
Write-Host "   📦 MinIO:           http://10.228.141.81:9000" -ForegroundColor White
Write-Host "   🎛️  MinIO Console:   http://10.228.141.81:9001" -ForegroundColor White
Write-Host ""
Write-Host "📱 To start mobile app:" -ForegroundColor Cyan
Write-Host "   .\scripts\start-mobile.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Cyan
Write-Host "   .\scripts\stop-all.ps1" -ForegroundColor White
Write-Host ""

# Store job IDs for cleanup
$lambdaJob.Id | Out-File -FilePath ".lambda.pid" -Encoding ASCII

Write-Success "Development environment is ready! 🚀"
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running and monitor jobs
try {
    while ($true) {
        if ($lambdaJob.State -eq "Failed") {
            Write-Error "Lambda server failed!"
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