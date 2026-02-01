# HandShakeMe Local Development Shutdown Script (Windows PowerShell)

Write-Host "🛑 Stopping HandShakeMe Local Development Environment" -ForegroundColor Red
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

# Stop PowerShell jobs
if (Test-Path ".lambda.pid") {
    $lambdaJobId = Get-Content ".lambda.pid"
    try {
        $job = Get-Job -Id $lambdaJobId -ErrorAction SilentlyContinue
        if ($job) {
            Write-Status "Stopping Lambda API server (Job ID: $lambdaJobId)..."
            Stop-Job -Id $lambdaJobId -ErrorAction SilentlyContinue
            Remove-Job -Id $lambdaJobId -ErrorAction SilentlyContinue
            Write-Success "Lambda API server stopped"
        } else {
            Write-Warning "Lambda API server job not found"
        }
    } catch {
        Write-Warning "Could not stop Lambda API server job"
    }
    Remove-Item ".lambda.pid" -ErrorAction SilentlyContinue
}

# Stop Node.js processes (fallback)
Write-Status "Stopping any remaining Node.js processes..."
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq "node" -and $_.CommandLine -like "*lambda*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
    # Ignore errors
}

# Stop Docker services
Write-Status "Stopping Docker services..."
docker-compose -f docker-compose.local.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Success "Docker services stopped"
} else {
    Write-Warning "Some Docker services may still be running"
}

Write-Success "All services stopped successfully! 🎉"
Write-Host ""
Write-Host "💡 To start again, run: .\scripts\start-all.ps1" -ForegroundColor Cyan