#!/bin/bash

# HandShakeMe System Test Script
# Tests all components and connections

set -e

echo "🧪 Testing HandShakeMe Local Development Environment"
echo "📍 Local IP: 10.228.141.81"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_test "$test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_pass "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_fail "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "🔍 Testing Infrastructure Services..."
echo ""

# Test PostgreSQL
run_test "PostgreSQL Connection" "docker exec handshakeme-postgres pg_isready -U handshakeme -d handshakeme_dev"

# Test Redis
run_test "Redis Connection" "docker exec handshakeme-redis redis-cli ping"

# Test MinIO
run_test "MinIO Health Check" "curl -f http://10.228.141.81:9000/minio/health/live"

echo ""
echo "🔍 Testing API Services..."
echo ""

# Test API Server Health
run_test "API Server Health" "curl -f http://10.228.141.81:3000/health"

# Test API Server Categories
run_test "API Categories Endpoint" "curl -f http://10.228.141.81:3000/categories"

# Test WebSocket Server
run_test "WebSocket Server" "timeout 5 bash -c '</dev/tcp/10.228.141.81/3001'"

# Test Telegram Bot
run_test "Telegram Bot Health" "curl -f http://10.228.141.81:3002/health"

echo ""
echo "🔍 Testing Database Schema..."
echo ""

# Test database tables
run_test "Users Table" "docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c 'SELECT COUNT(*) FROM users;'"

run_test "Categories Table" "docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c 'SELECT COUNT(*) FROM categories;'"

run_test "Master Profiles Table" "docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c 'SELECT COUNT(*) FROM master_profiles;'"

run_test "Client Profiles Table" "docker exec handshakeme-postgres psql -U handshakeme -d handshakeme_dev -c 'SELECT COUNT(*) FROM client_profiles;'"

echo ""
echo "🔍 Testing MinIO Buckets..."
echo ""

# Test MinIO buckets (using mc client in container)
run_test "Avatars Bucket" "docker exec handshakeme-minio-client mc ls myminio/handshakeme-avatars"

run_test "Portfolio Bucket" "docker exec handshakeme-minio-client mc ls myminio/handshakeme-portfolio"

run_test "Orders Bucket" "docker exec handshakeme-minio-client mc ls myminio/handshakeme-orders"

echo ""
echo "🔍 Testing API Endpoints..."
echo ""

# Test various API endpoints
API_ENDPOINTS=(
    "/health:API Health Check"
    "/categories:Categories List"
    "/auth/telegram-login:Telegram Login (should return 400)"
    "/users/me:Users Endpoint"
    "/orders:Orders Endpoint"
    "/masters:Masters Endpoint"
    "/bookings:Bookings Endpoint"
    "/bookings/instant:Instant Booking Endpoint"
)

for endpoint_info in "${API_ENDPOINTS[@]}"; do
    IFS=':' read -r endpoint description <<< "$endpoint_info"
    
    if [[ "$endpoint" == "/auth/telegram-login" ]]; then
        # This should return 400 (bad request) which is expected
        run_test "$description" "curl -s http://10.228.141.81:3000$endpoint | grep -q 'VALIDATION_ERROR\\|success'"
    else
        run_test "$description" "curl -f http://10.228.141.81:3000$endpoint"
    fi
done

echo ""
echo "🔍 Testing File System..."
echo ""

# Test file system structure
run_test "Lambda Core Files" "test -d lambda/core"
run_test "Mobile App Files" "test -f mobile/app.json"
run_test "Docker Compose File" "test -f docker-compose.local.yml"
run_test "Environment Files" "test -f lambda/.env.local && test -f mobile/.env.local"

echo ""
echo "🔍 Testing Node.js Dependencies..."
echo ""

# Test Node.js dependencies
run_test "Lambda Dependencies" "test -d lambda/node_modules"
run_test "Mobile Dependencies" "test -d mobile/node_modules"
run_test "Telegram Bot Dependencies" "test -d telegram-bot/node_modules"

echo ""
echo "📊 Test Results Summary"
echo "========================"
echo ""
echo "Total Tests: $TESTS_TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is ready for development.${NC}"
    echo ""
    echo "📱 Next steps:"
    echo "1. Start mobile app: ./scripts/start-mobile.sh"
    echo "2. Open mobile app on device/emulator"
    echo "3. Test Telegram bot authentication"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "1. Make sure all services are running: ./scripts/start-all.sh"
    echo "2. Check Docker containers: docker-compose -f docker-compose.local.yml ps"
    echo "3. Check logs: docker-compose -f docker-compose.local.yml logs"
    echo ""
    exit 1
fi