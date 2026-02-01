# HandShakeMe - Start Mobile App (Windows)

Write-Host "Starting HandShakeMe Mobile App..." -ForegroundColor Blue
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

# Check if we're in the right directory
if (!(Test-Path "mobile/package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Navigate to mobile directory
Push-Location mobile

# Create localhost environment file
Write-Status "Setting up localhost environment..."
$mobileEnv = @"
# Local Development Environment (Windows)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3001
EXPO_PUBLIC_UPLOAD_URL=http://localhost:9000
EXPO_PUBLIC_TELEGRAM_BOT=handshakeme_test_bot
EXPO_PUBLIC_APP_NAME=HandShakeMe Dev
EXPO_PUBLIC_APP_VERSION=1.0.0-dev
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_ENABLE_INSTANT_BOOKING=true
EXPO_PUBLIC_ENABLE_VIDEO_CALLS=true
EXPO_PUBLIC_ENABLE_REAL_TIME_TRACKING=true
EXPO_PUBLIC_ANALYTICS_ENABLED=false
EXPO_PUBLIC_CRASHLYTICS_ENABLED=false
EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=false
"@
$mobileEnv | Out-File -FilePath ".env" -Encoding UTF8

# Install dependencies
Write-Status "Installing dependencies..."
if (!(Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        Pop-Location
        exit 1
    }
}

# Check if Expo CLI is installed
try {
    expo --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Status "Installing Expo CLI..."
    npm install -g @expo/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Expo CLI. Try running as Administrator."
        Pop-Location
        exit 1
    }
}

Write-Success "Environment configured for localhost"
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   API URL:         http://localhost:3000" -ForegroundColor White
Write-Host "   WebSocket URL:   ws://localhost:3001" -ForegroundColor White
Write-Host "   Upload URL:      http://localhost:9000" -ForegroundColor White
Write-Host ""

# Get local IP for mobile device connection
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress
    if ($localIP) {
        Write-Host "For mobile device connection:" -ForegroundColor Cyan
        Write-Host "   Your computer IP: $localIP" -ForegroundColor White
        Write-Host "   Make sure device is on same Wi-Fi network" -ForegroundColor White
        Write-Host ""
    }
} catch {
    # Ignore IP detection errors
}

# Start Expo development server
Write-Status "Starting Expo development server..."
Write-Host ""

# Start with localhost for Windows compatibility
expo start --localhost --port 8081

Pop-Location