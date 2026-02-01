#!/bin/bash

# HandShakeMe Mobile App Startup Script
# IP: 10.228.141.81

set -e

echo "📱 Starting HandShakeMe Mobile App"
echo "📍 Local IP: 10.228.141.81"
echo ""

# Colors for output
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

# Check if we're in the right directory
if [ ! -f "mobile/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Navigate to mobile directory
cd mobile

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

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI not found. Installing globally..."
    npm install -g @expo/cli
fi

print_success "Environment configured for local development"
echo ""
echo "📋 Configuration:"
echo "   🔗 API URL:         http://10.228.141.81:3000"
echo "   🔌 WebSocket URL:   ws://10.228.141.81:3001"
echo "   📦 Upload URL:      http://10.228.141.81:9000"
echo "   🤖 Telegram Bot:    handshakeme_test_bot"
echo ""

# Start Expo development server
print_status "Starting Expo development server..."
echo ""
print_warning "Make sure your mobile device/emulator is connected to the same network (10.228.141.81)"
echo ""

# Start with tunnel for better connectivity
expo start --host 10.228.141.81 --port 8081

print_success "Mobile app development server started! 📱"