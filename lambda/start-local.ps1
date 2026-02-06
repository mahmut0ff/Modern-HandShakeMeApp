# HandShakeMe Lambda - Local Development Script
# Run this to start the API locally with SAM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HandShakeMe Lambda - Local Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if SAM CLI is installed
$samVersion = sam --version 2>$null
if (-not $samVersion) {
    Write-Host "ERROR: AWS SAM CLI is not installed!" -ForegroundColor Red
    Write-Host "Install it from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "SAM CLI: $samVersion" -ForegroundColor Green

# Check if Docker is running (required for SAM local)
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "SAM local requires Docker. Please start Docker Desktop." -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker: Running" -ForegroundColor Green

# Build TypeScript
Write-Host "`nBuilding TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed, but continuing (some warnings are OK)..." -ForegroundColor Yellow
}

# Load environment variables from .env
if (Test-Path ".env") {
    Write-Host "`nLoading environment variables from .env..." -ForegroundColor Yellow
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Start SAM local API
Write-Host "`nStarting SAM Local API on http://localhost:3000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

sam local start-api --port 3000 --warm-containers EAGER --env-vars env.json 2>$null

# If env.json doesn't exist, run without it
if ($LASTEXITCODE -ne 0) {
    sam local start-api --port 3000 --warm-containers EAGER
}
