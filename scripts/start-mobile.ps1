# HandShakeMe Mobile App Startup Script (Windows PowerShell)
# IP: 10.228.141.81

Write-Host "📱 Starting HandShakeMe Mobile App" -ForegroundColor Blue
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

# Check if we're in the right directory
if (!(Test-Path "mobile/package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Navigate to mobile directory
Push-Location mobile

# Copy local environment
Write-Status "Setting up local environment..."
Copy-Item ".env.local" ".env" -Force

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
        Pop-Location
        exit 1
    }
}

Write-Success "Environment configured for local development"
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   🔗 API URL:         http://10.228.141.81:3000" -ForegroundColor White
Write-Host "   🔌 WebSocket URL:   ws://10.228.141.81:3001" -ForegroundColor White
Write-Host "   📦 Upload URL:      http://10.228.141.81:9000" -ForegroundColor White
Write-Host "   🤖 Telegram Bot:    handshakeme_test_bot" -ForegroundColor White
Write-Host ""

# Start Expo development server
Write-Status "Starting Expo development server..."
Write-Host ""
Write-Warning "Make sure your mobile device/emulator is connected to the same network (10.228.141.81)"
Write-Host ""

# Start with specific host for better connectivity
expo start --host 10.228.141.81 --port 8081

Pop-Location
Write-Success "Mobile app development server started! 📱"