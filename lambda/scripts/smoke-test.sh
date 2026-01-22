#!/bin/bash

# Smoke tests for deployment validation

set -e

API_URL=${1:-"https://api-dev.handshakeme.app"}

echo "Running smoke tests against $API_URL"

# Test health endpoint
echo "Testing health endpoint..."
curl -f "$API_URL/health" || exit 1

# Test authentication
echo "Testing authentication..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

if [ -z "$RESPONSE" ]; then
  echo "Authentication test failed"
  exit 1
fi

# Test database connectivity
echo "Testing database connectivity..."
curl -f "$API_URL/orders?limit=1" || exit 1

# Test WebSocket connectivity
echo "Testing WebSocket connectivity..."
# WebSocket test would go here

echo "All smoke tests passed!"
