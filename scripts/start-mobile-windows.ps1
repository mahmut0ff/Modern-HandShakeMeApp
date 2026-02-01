# HandShakeMe Mobile App Startup Script (Windows PowerShell)
# Исправленная версия для Windows с localhost

Write-Host "📱 Starting HandShakeMe Mobile App (Windows)" -ForegroundColor Blue
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

# Check if we're in the right directory
if (!(Test-Path "mobile/package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Navigate to mobile directory
Push-Location mobile

# Create localhost environment file
Write-Status "Setting up localhost environment..."
@"
# Local Development Environment (Windows)
# Using localhost instead of IP

# API Configuration (Local Lambda)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Telegram Bot (Test)
EXPO_PUBLIC_TELEGRAM_BOT=handshakeme_test_bot

# WebSocket Configuration (Local)
EXPO_PUBLIC_WS_URL=ws://localhost:3001

# File Upload (Local MinIO)
EXPO_PUBLIC_UPLOAD_URL=http://localhost:9000

# App Configuration
EXPO_PUBLIC_APP_NAME=HandShakeMe Dev
EXPO_PUBLIC_APP_VERSION=1.0.0-dev

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG=true

# Local Development
EXPO_PUBLIC_DEV_MODE=true

# Features (Local testing)
EXPO_PUBLIC_ENABLE_INSTANT_BOOKING=true
EXPO_PUBLIC_ENABLE_VIDEO_CALLS=true
EXPO_PUBLIC_ENABLE_REAL_TIME_TRACKING=true

# Analytics (Disabled in dev)
EXPO_PUBLIC_ANALYTICS_ENABLED=false
EXPO_PUBLIC_CRASHLYTICS_ENABLED=false

# Notifications (Local testing)
EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=false
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        Pop-Location
        exit 1
    }
} else {
    Write-Status "Dependencies already installed"
}

# Check if Expo CLI is installed
try {
    expo --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Warning "Expo CLI not found. Installing globally..."
    npm install -g @expo/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Expo CLI"
        Write-Host "Try running PowerShell as Administrator" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
}

# Check if API server is running
Write-Status "Checking API server connection..."
$apiRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $apiRunning = $true
    }
} catch {
    # API server not running
}

if (-not $apiRunning) {
    Write-Warning "API server is not running on http://localhost:3000"
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  .\scripts\start-all-windows.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or continue anyway if you want to start mobile app first..." -ForegroundColor Cyan
    Write-Host ""
}

Write-Success "Environment configured for localhost development"
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   🔗 API URL:         http://localhost:3000" -ForegroundColor White
Write-Host "   🔌 WebSocket URL:   ws://localhost:3001" -ForegroundColor White
Write-Host "   📦 Upload URL:      http://localhost:9000" -ForegroundColor White
Write-Host "   🤖 Telegram Bot:    handshakeme_test_bot" -ForegroundColor White
Write-Host ""

# Get local IP for mobile device connection
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue).IPAddress
    if (-not $localIP) {
        $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress
    }
    if ($localIP) {
        Write-Host "📱 For mobile device connection:" -ForegroundColor Cyan
        Write-Host "   Your computer IP: $localIP" -ForegroundColor White
        Write-Host "   Make sure your mobile device is on the same Wi-Fi network" -ForegroundColor White
        Write-Host ""
    }
} catch {
    # Ignore IP detection errors
}

# Start Expo development server
Write-Status "Starting Expo development server..."
Write-Host ""
Write-Warning "Choose connection method:"
Write-Host "1. USB/Emulator - Use localhost URLs" -ForegroundColor White
Write-Host "2. Wi-Fi Device - Expo will provide QR code" -ForegroundColor White
Write-Host ""

# Start with localhost for better Windows compatibility
expo start --localhost --port 8081

Pop-Location
Write-Success "Mobile app development server started! 📱"