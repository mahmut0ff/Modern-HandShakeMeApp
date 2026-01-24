#!/bin/bash

# Verify Disputes Module Deployment
# This script checks if all Lambda functions and API routes are deployed correctly

set -e

echo "🔍 Verifying Disputes Module Deployment..."
echo ""

# Configuration
PROJECT_NAME="${PROJECT_NAME:-handshake}"
ENVIRONMENT="${ENVIRONMENT:-prod}"
API_ID="${API_ID}"

if [ -z "$API_ID" ]; then
  echo "❌ Error: API_ID environment variable not set"
  echo "Usage: API_ID=your-api-id ./verify-disputes-deployment.sh"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check Lambda function
check_lambda() {
  local function_name=$1
  
  if aws lambda get-function --function-name "$function_name" &> /dev/null; then
    echo -e "${GREEN}✅${NC} Lambda: $function_name"
    return 0
  else
    echo -e "${RED}❌${NC} Lambda: $function_name (NOT FOUND)"
    return 1
  fi
}

# Function to check API route
check_route() {
  local route_key=$1
  
  if aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='$route_key'].RouteKey" --output text | grep -q "$route_key"; then
    echo -e "${GREEN}✅${NC} Route: $route_key"
    return 0
  else
    echo -e "${RED}❌${NC} Route: $route_key (NOT FOUND)"
    return 1
  fi
}

# Check Lambda Functions
echo "📦 Checking Lambda Functions..."
echo ""

lambda_count=0
lambda_success=0

functions=(
  "$PROJECT_NAME-create-dispute-$ENVIRONMENT"
  "$PROJECT_NAME-get-disputes-$ENVIRONMENT"
  "$PROJECT_NAME-get-dispute-$ENVIRONMENT"
  "$PROJECT_NAME-update-dispute-status-$ENVIRONMENT"
  "$PROJECT_NAME-close-dispute-$ENVIRONMENT"
  "$PROJECT_NAME-escalate-dispute-$ENVIRONMENT"
  "$PROJECT_NAME-request-mediation-$ENVIRONMENT"
  "$PROJECT_NAME-get-dispute-messages-$ENVIRONMENT"
  "$PROJECT_NAME-send-dispute-message-$ENVIRONMENT"
  "$PROJECT_NAME-add-evidence-$ENVIRONMENT"
  "$PROJECT_NAME-accept-resolution-$ENVIRONMENT"
)

for func in "${functions[@]}"; do
  lambda_count=$((lambda_count + 1))
  if check_lambda "$func"; then
    lambda_success=$((lambda_success + 1))
  fi
done

echo ""
echo "Lambda Functions: $lambda_success/$lambda_count"
echo ""

# Check API Routes
echo "🌐 Checking API Gateway Routes..."
echo ""

route_count=0
route_success=0

routes=(
  "POST /disputes"
  "GET /disputes"
  "GET /disputes/{id}"
  "PATCH /disputes/{id}/status"
  "POST /disputes/{id}/close"
  "POST /disputes/{id}/escalate"
  "POST /disputes/{id}/mediate"
  "GET /disputes/{id}/messages"
  "POST /disputes/{id}/messages"
  "POST /disputes/{id}/evidence"
  "POST /disputes/{id}/accept"
)

for route in "${routes[@]}"; do
  route_count=$((route_count + 1))
  if check_route "$route"; then
    route_success=$((route_success + 1))
  fi
done

echo ""
echo "API Routes: $route_success/$route_count"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Lambda Functions: $lambda_success/$lambda_count"
echo "API Routes: $route_success/$route_count"
echo ""

total_success=$((lambda_success + route_success))
total_count=$((lambda_count + route_count))

if [ $total_success -eq $total_count ]; then
  echo -e "${GREEN}✅ Deployment Successful!${NC}"
  echo ""
  echo "All disputes module components are deployed correctly."
  exit 0
else
  echo -e "${RED}❌ Deployment Incomplete${NC}"
  echo ""
  echo "Some components are missing. Please check the errors above."
  exit 1
fi
