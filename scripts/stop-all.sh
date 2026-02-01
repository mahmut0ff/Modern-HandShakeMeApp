#!/bin/bash

# HandShakeMe Local Development Shutdown Script

set -e

echo "🛑 Stopping HandShakeMe Local Development Environment"
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

# Stop Node.js processes
if [ -f ".lambda.pid" ]; then
    LAMBDA_PID=$(cat .lambda.pid)
    if kill -0 $LAMBDA_PID 2>/dev/null; then
        print_status "Stopping Lambda API server (PID: $LAMBDA_PID)..."
        kill $LAMBDA_PID
        print_success "Lambda API server stopped"
    else
        print_warning "Lambda API server not running"
    fi
    rm -f .lambda.pid
fi

if [ -f ".telegram.pid" ]; then
    TELEGRAM_PID=$(cat .telegram.pid)
    if kill -0 $TELEGRAM_PID 2>/dev/null; then
        print_status "Stopping Telegram Bot (PID: $TELEGRAM_PID)..."
        kill $TELEGRAM_PID
        print_success "Telegram Bot stopped"
    else
        print_warning "Telegram Bot not running"
    fi
    rm -f .telegram.pid
fi

# Stop Docker services
print_status "Stopping Docker services..."
docker-compose -f docker-compose.local.yml down

print_success "All services stopped successfully! 🎉"
echo ""
echo "💡 To start again, run: ./scripts/start-all.sh"