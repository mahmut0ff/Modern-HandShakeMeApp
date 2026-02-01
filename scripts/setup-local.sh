#!/bin/bash

# HandShakeMe Local Development Setup Script
# One-time setup for local development environment

set -e

echo "🔧 Setting up HandShakeMe Local Development Environment"
echo "📍 Local IP: 10.228.141.81"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "All prerequisites are installed ✓"
echo ""

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/*.sh
print_success "Scripts are now executable"

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p lambda/uploads
print_success "Uploads directory created"

# Pull Docker images
print_status "Pulling Docker images..."
docker-compose -f docker-compose.local.yml pull
print_success "Docker images pulled"

# Start infrastructure services
print_status "Starting infrastructure services..."
docker-compose -f docker-compose.local.yml up -d postgres redis minio minio-client

# Wait for services
print_status "Waiting for services to start..."
sleep 15

# Check PostgreSQL
print_status "Checking PostgreSQL..."
until docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev > /dev/null 2>&1; do
    print_warning "Waiting for PostgreSQL..."
    sleep 2
done
print_success "PostgreSQL is ready"

# Check Redis
print_status "Checking Redis..."
until docker exec handshakeme-redis redis-cli ping > /dev/null 2>&1; do
    print_warning "Waiting for Redis..."
    sleep 2
done
print_success "Redis is ready"

# Check MinIO
print_status "Checking MinIO..."
until curl -f http://10.228.141.81:9000/minio/health/live > /dev/null 2>&1; do
    print_warning "Waiting for MinIO..."
    sleep 2
done
print_success "MinIO is ready"

echo ""
print_success "🎉 Local development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. 🚀 Start all services:"
echo "   ./scripts/start-all.sh"
echo ""
echo "2. 📱 Start mobile app (in separate terminal):"
echo "   ./scripts/start-mobile.sh"
echo ""
echo "📊 Service URLs:"
echo "   🗄️  PostgreSQL:     10.228.141.81:5432"
echo "   🔴 Redis:           10.228.141.81:6379"
echo "   📦 MinIO:           http://10.228.141.81:9000"
echo "   🎛️  MinIO Console:   http://10.228.141.81:9001 (admin/admin)"
echo ""
echo "💡 Useful commands:"
echo "   ./scripts/start-all.sh     - Start all services"
echo "   ./scripts/stop-all.sh      - Stop all services"
echo "   ./scripts/start-mobile.sh  - Start mobile app only"
echo "   ./scripts/start-lambda.sh  - Start API server only"
echo ""
print_success "Happy coding! 🚀"