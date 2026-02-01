# HandShakeMe Lambda API Server Startup Script (Windows PowerShell)
# IP: 10.228.141.81

Write-Host "🔧 Starting HandShakeMe Lambda API Server" -ForegroundColor Blue
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
if (!(Test-Path "lambda/package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Navigate to lambda directory
Push-Location lambda

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

# Check database connection
Write-Status "Checking database connection..."
$dbCheck = @"
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"@

$dbCheck | Out-File -FilePath "temp_db_check.js" -Encoding UTF8
node temp_db_check.js
$dbResult = $LASTEXITCODE
Remove-Item "temp_db_check.js" -ErrorAction SilentlyContinue

if ($dbResult -ne 0) {
    Write-Error "Database connection failed. Make sure PostgreSQL is running."
    Write-Warning "Run: docker-compose -f docker-compose.local.yml up -d postgres"
    Pop-Location
    exit 1
}

# Check Redis connection
Write-Status "Checking Redis connection..."
$redisCheck = @"
const redis = require('redis');
require('dotenv').config();
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect().then(() => {
  console.log('✅ Redis connection successful');
  client.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});
"@

$redisCheck | Out-File -FilePath "temp_redis_check.js" -Encoding UTF8
node temp_redis_check.js
$redisResult = $LASTEXITCODE
Remove-Item "temp_redis_check.js" -ErrorAction SilentlyContinue

if ($redisResult -ne 0) {
    Write-Error "Redis connection failed. Make sure Redis is running."
    Write-Warning "Run: docker-compose -f docker-compose.local.yml up -d redis"
    Pop-Location
    exit 1
}

Write-Success "All dependencies are ready"
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   🔗 API Server:      http://10.228.141.81:3000" -ForegroundColor White
Write-Host "   🔌 WebSocket:       ws://10.228.141.81:3001" -ForegroundColor White
Write-Host "   🗄️  Database:       10.228.141.81:5432" -ForegroundColor White
Write-Host "   🔴 Redis:           10.228.141.81:6379" -ForegroundColor White
Write-Host "   📦 MinIO:           http://10.228.141.81:9000" -ForegroundColor White
Write-Host ""

# Start the server
Write-Status "Starting Lambda API server..."
Write-Host ""

npm run dev

Pop-Location