#!/bin/bash

# HandShakeMe Lambda API Server Startup Script
# IP: 10.228.141.81

set -e

echo "🔧 Starting HandShakeMe Lambda API Server"
echo "📍 Local IP: 10.228.141.81"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "lambda/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Navigate to lambda directory
cd lambda

# Copy local environment
print_status "Setting up local environment..."
cp .env.local .env

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
else
    print_status "Dependencies already installed"
fi

# Check database connection
print_status "Checking database connection..."
if ! node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; then
    print_error "Database connection failed. Make sure PostgreSQL is running."
    print_warning "Run: docker-compose -f docker-compose.local.yml up -d postgres"
    exit 1
fi

# Check Redis connection
print_status "Checking Redis connection..."
if ! node -e "
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect().then(() => {
  console.log('✅ Redis connection successful');
  client.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; then
    print_error "Redis connection failed. Make sure Redis is running."
    print_warning "Run: docker-compose -f docker-compose.local.yml up -d redis"
    exit 1
fi

print_success "All dependencies are ready"
echo ""
echo "📋 Configuration:"
echo "   🔗 API Server:      http://10.228.141.81:3000"
echo "   🔌 WebSocket:       ws://10.228.141.81:3001"
echo "   🗄️  Database:       10.228.141.81:5432"
echo "   🔴 Redis:           10.228.141.81:6379"
echo "   📦 MinIO:           http://10.228.141.81:9000"
echo ""

# Start the server
print_status "Starting Lambda API server..."
echo ""

npm run dev