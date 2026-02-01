#!/bin/bash

# HandShakeMe Local Development Startup Script
# IP: 10.228.141.81

set -e

echo "🚀 Starting HandShakeMe Local Development Environment"
echo "📍 Local IP: 10.228.141.81"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking prerequisites..."
print_success "Docker: ✓"
print_success "Node.js: $(node --version)"
print_success "npm: $(npm --version)"
echo ""

# Step 1: Start infrastructure services
print_status "Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
print_status "Checking PostgreSQL connection..."
until docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev > /dev/null 2>&1; do
    print_warning "Waiting for PostgreSQL..."
    sleep 2
done
print_success "PostgreSQL is ready"

# Check if Redis is ready
print_status "Checking Redis connection..."
until docker exec handshakeme-redis redis-cli ping > /dev/null 2>&1; do
    print_warning "Waiting for Redis..."
    sleep 2
done
print_success "Redis is ready"

# Check if MinIO is ready
print_status "Checking MinIO connection..."
until curl -f http://10.228.141.81:9000/minio/health/live > /dev/null 2>&1; do
    print_warning "Waiting for MinIO..."
    sleep 2
done
print_success "MinIO is ready"

echo ""

# Step 2: Install Lambda dependencies
print_status "Installing Lambda dependencies..."
cd lambda
if [ ! -d "node_modules" ]; then
    npm install
else
    print_warning "Lambda dependencies already installed, skipping..."
fi
cd ..

# Step 3: Install Mobile dependencies
print_status "Installing Mobile app dependencies..."
cd mobile
if [ ! -d "node_modules" ]; then
    npm install
else
    print_warning "Mobile dependencies already installed, skipping..."
fi
cd ..

echo ""

# Step 4: Start Lambda server
print_status "Starting Lambda API server..."
cd lambda
npm run dev &
LAMBDA_PID=$!
cd ..

# Wait for Lambda to start
sleep 5

echo ""
print_success "🎉 All services started successfully!"
echo ""
echo "📋 Service URLs:"
echo "   🔗 API Server:      http://10.228.141.81:3000"
echo "   🔌 WebSocket:       ws://10.228.141.81:3001"
echo "   🗄️  PostgreSQL:     10.228.141.81:5432"
echo "   🔴 Redis:           10.228.141.81:6379"
echo "   📦 MinIO:           http://10.228.141.81:9000"
echo "   🎛️  MinIO Console:   http://10.228.141.81:9001"
echo ""
echo "📱 To start mobile app:"
echo "   cd mobile && npm start"
echo ""
echo "🛑 To stop all services:"
echo "   ./scripts/stop-all.sh"
echo ""

# Create PID file for cleanup
echo "$LAMBDA_PID" > .lambda.pid

print_success "Development environment is ready! 🚀"