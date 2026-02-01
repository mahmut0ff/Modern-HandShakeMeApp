# HandShakeMe System Test Script (Windows PowerShell)
# Tests all components and connections

Write-Host "🧪 Testing HandShakeMe Local Development Environment" -ForegroundColor Blue
Write-Host "📍 Local IP: 10.228.141.81" -ForegroundColor Cyan
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

function Write-Warn {
    param($Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

# Test counter
$script:TestsTotal = 0
$script:TestsPassed = 0
$script:TestsFailed = 0

function Run-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    $script:TestsTotal++
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

Write-Host "🔍 Testing Infrastructure Services..." -ForegroundColor Yellow
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
        $response = Invoke-WebRequest -Uri "http://10.228.141.81:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "🔍 Testing API Services..." -ForegroundColor Yellow
Write-Host ""

# Test API Server Health
Run-Test "API Server Health" {
    try {
        $response = Invoke-WebRequest -Uri "http://10.228.141.81:3000/health" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Test API Server Categories
Run-Test "API Categories Endpoint" {
    try {
        $response = Invoke-WebRequest -Uri "http://10.228.141.81:3000/categories" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Test WebSocket Server
Run-Test "WebSocket Server" {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("10.228.141.81", 3001)
        $connected = $tcpClient.Connected
        $tcpClient.Close()
        return $connected
    } catch {
        return $false
    }
}

# Test Telegram Bot
Run-Test "Telegram Bot Health" {
    try {
        $response = Invoke-WebRequest -Uri "http://10.228.141.81:3002/health" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "🔍 Testing Database Schema..." -ForegroundColor Yellow
Write-Host ""

# Test database tables
Run-Test "Users Table" {
    try {
        docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c "SELECT COUNT(*) FROM users;" | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

Run-Test "Categories Table" {
    try {
        docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c "SELECT COUNT(*) FROM categories;" | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

Run-Test "Master Profiles Table" {
    try {
        docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c "SELECT COUNT(*) FROM master_profiles;" | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

Run-Test "Client Profiles Table" {
    try {
        docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c "SELECT COUNT(*) FROM client_profiles;" | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "🔍 Testing API Endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test various API endpoints
$endpoints = @(
    @{Path="/health"; Description="API Health Check"},
    @{Path="/categories"; Description="Categories List"},
    @{Path="/users/me"; Description="Users Endpoint"},
    @{Path="/orders"; Description="Orders Endpoint"},
    @{Path="/masters"; Description="Masters Endpoint"},
    @{Path="/bookings"; Description="Bookings Endpoint"},
    @{Path="/bookings/instant"; Description="Instant Booking Endpoint"}
)

foreach ($endpoint in $endpoints) {
    Run-Test $endpoint.Description {
        try {
            $response = Invoke-WebRequest -Uri "http://10.228.141.81:3000$($endpoint.Path)" -UseBasicParsing -TimeoutSec 5
            return $response.StatusCode -eq 200
        } catch {
            return $false
        }
    }
}

Write-Host ""
Write-Host "🔍 Testing File System..." -ForegroundColor Yellow
Write-Host ""

# Test file system structure
Run-Test "Lambda Core Files" { Test-Path "lambda/core" }
Run-Test "Mobile App Files" { Test-Path "mobile/app.json" }
Run-Test "Docker Compose File" { Test-Path "docker-compose.local.yml" }
Run-Test "Environment Files" { (Test-Path "lambda/.env.local") -and (Test-Path "mobile/.env.local") }

Write-Host ""
Write-Host "🔍 Testing Node.js Dependencies..." -ForegroundColor Yellow
Write-Host ""

# Test Node.js dependencies
Run-Test "Lambda Dependencies" { Test-Path "lambda/node_modules" }
Run-Test "Mobile Dependencies" { Test-Path "mobile/node_modules" }
Run-Test "Telegram Bot Dependencies" { Test-Path "telegram-bot/node_modules" }

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Total Tests: $script:TestsTotal" -ForegroundColor White
Write-Host "Passed: $script:TestsPassed" -ForegroundColor Green
Write-Host "Failed: $script:TestsFailed" -ForegroundColor Red
Write-Host ""

if ($script:TestsFailed -eq 0) {
    Write-Host "🎉 All tests passed! System is ready for development." -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start mobile app: .\scripts\start-mobile.ps1" -ForegroundColor White
    Write-Host "2. Open mobile app on device/emulator" -ForegroundColor White
    Write-Host "3. Test Telegram bot authentication" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please check the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Make sure all services are running: .\scripts\start-all.ps1" -ForegroundColor White
    Write-Host "2. Check Docker containers: docker-compose -f docker-compose.local.yml ps" -ForegroundColor White
    Write-Host "3. Check logs: docker-compose -f docker-compose.local.yml logs" -ForegroundColor White
    Write-Host ""
    exit 1
}