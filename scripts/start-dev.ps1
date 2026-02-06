# HandShakeMe - Local Development Startup Script

Write-Host @"

  _   _                 _ ____  _           _        __  __      
 | | | | __ _ _ __   __| / ___|| |__   __ _| | _____|  \/  | ___ 
 | |_| |/ _\`| '_ \ / _\`\___ \| '_ \ / _\`| |/ / _ \ |\/| |/ _ \
 |  _  | (_| | | | | (_| |___) | | | | (_| |   <  __/ |  | |  __/
 |_| |_|\__,_|_| |_|\__,_|____/|_| |_|\__,_|_|\_\___|_|  |_|\___|
                                                                  
  Local Development Environment
  
"@ -ForegroundColor Cyan

# Check DynamoDB Local
Write-Host "Checking DynamoDB Local..." -ForegroundColor Yellow
$tcpTest = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue

if (-not $tcpTest.TcpTestSucceeded) {
    Write-Host "DynamoDB Local is not running!" -ForegroundColor Red
    Write-Host @"

Start DynamoDB Local with one of these commands:

  Docker:
    docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

  Or if you have Java installed:
    java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

"@ -ForegroundColor Yellow
    exit 1
}
Write-Host "DynamoDB Local is running" -ForegroundColor Green

# Create table if needed
Write-Host "`nCreating DynamoDB table..." -ForegroundColor Yellow
& "$PSScriptRoot\..\lambda\scripts\create-dynamodb-table.ps1"

# Build Lambda
Write-Host "`nBuilding Lambda functions..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\..\lambda"
npm run build
Pop-Location

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" } | Select-Object -First 1).IPAddress

Write-Host @"

=== Ready to Start ===

1. Start Lambda Server:
   cd lambda && node local-server.js

2. Start Telegram Bot (optional):
   cd lambda && node telegram-bot-local.js

3. Start Mobile App:
   cd mobile && npx expo start

Your local IP: $localIP
Update mobile/.env with: EXPO_PUBLIC_API_URL=http://${localIP}:3000

"@ -ForegroundColor Green
