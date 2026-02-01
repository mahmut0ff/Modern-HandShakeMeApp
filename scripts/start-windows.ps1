# HandShakeMe - Start All Services (Windows)

Write-Host "Starting HandShakeMe Development Environment..." -ForegroundColor Blue
Write-Host ""

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if infrastructure is running
Write-Status "Checking infrastructure..."
try {
    docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "Starting infrastructure services..."
        docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client
        Start-Sleep -Seconds 10
    }
} catch {
    Write-Status "Starting infrastructure services..."
    docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client
    Start-Sleep -Seconds 10
}

# Install Lambda dependencies
Write-Status "Installing Lambda dependencies..."
Push-Location lambda
if (!(Test-Path "node_modules")) {
    npm install
}
Pop-Location

# Start Lambda API server
Write-Status "Starting Lambda API server..."
Push-Location lambda
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Success "All services started!"
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "   API Server:      http://localhost:3000" -ForegroundColor White
Write-Host "   WebSocket:       ws://localhost:3001" -ForegroundColor White
Write-Host "   MinIO Console:   http://localhost:9001 (admin/admin)" -ForegroundColor White
Write-Host ""
Write-Host "To start mobile app:" -ForegroundColor Cyan
Write-Host "   .\scripts\mobile-windows.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To test system:" -ForegroundColor Cyan
Write-Host "   .\scripts\test-windows.ps1" -ForegroundColor White