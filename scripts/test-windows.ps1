# HandShakeMe - Test System (Windows)

Write-Host "Testing HandShakeMe System..." -ForegroundColor Blue
Write-Host ""

function Write-Test {
    param($Message)
    Write-Host "[TEST] $Message" -ForegroundColor Blue
}

function Write-Pass {
    param($Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param($Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

$TestsPassed = 0
$TestsFailed = 0

function Run-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    Write-Test $TestName
    
    try {
        $result = & $TestCommand
        if ($result) {
            Write-Pass $TestName
            $script:TestsPassed++
            return $true
        } else {
            Write-Fail $TestName
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Fail "$TestName - $($_.Exception.Message)"
        $script:TestsFailed++
        return $false
    }
}

Write-Host "Testing Infrastructure Services..." -ForegroundColor Yellow
Write-Host ""

# Test PostgreSQL
Run-Test "PostgreSQL Connection" {
    try {
        docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Test Redis
Run-Test "Redis Connection" {
    try {
        docker exec handshakeme-redis redis-cli ping | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Test MinIO
Run-Test "MinIO Health Check" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "Testing API Services..." -ForegroundColor Yellow
Write-Host ""

# Test API Server Health
Run-Test "API Server Health" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Test Telegram Bot
Run-Test "Telegram Bot Health" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "Testing File System..." -ForegroundColor Yellow
Write-Host ""

# Test file system structure
Run-Test "Lambda Core Files" { Test-Path "lambda/core" }
Run-Test "Mobile App Files" { Test-Path "mobile/app.json" }
Run-Test "Docker Compose File" { Test-Path "docker-compose.local.yml" }
Run-Test "Environment Files" { (Test-Path "lambda/.env.local") -and (Test-Path "mobile/.env.local") }

Write-Host ""
Write-Host "Test Results Summary" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Total Tests: $($TestsPassed + $TestsFailed)" -ForegroundColor White
Write-Host "Passed: $TestsPassed" -ForegroundColor Green
Write-Host "Failed: $TestsFailed" -ForegroundColor Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "All tests passed! System is ready for development." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start mobile app: .\scripts\mobile-windows.ps1" -ForegroundColor White
    Write-Host "2. Open mobile app on device/emulator" -ForegroundColor White
    Write-Host "3. Test Telegram bot authentication" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Some tests failed. Please check the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Make sure all services are running: .\scripts\start-windows.ps1" -ForegroundColor White
    Write-Host "2. Check Docker containers: docker-compose -f docker-compose.local.yml ps" -ForegroundColor White
    Write-Host "3. Check logs: docker-compose -f docker-compose.local.yml logs" -ForegroundColor White
    Write-Host ""
}