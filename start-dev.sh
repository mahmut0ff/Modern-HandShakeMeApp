#!/bin/bash

echo "========================================"
echo "  HandShakeMe Development Server"
echo "========================================"
echo ""

cd lambda

echo "Starting REST API Server (port 3000)..."
npm run dev &
REST_PID=$!

sleep 2

echo "Starting WebSocket Server (port 3001)..."
npm run dev:ws &
WS_PID=$!

echo ""
echo "========================================"
echo "  Servers Started!"
echo "========================================"
echo "  REST API:  http://localhost:3000"
echo "  WebSocket: ws://localhost:3001"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Trap Ctrl+C and kill both processes
trap "kill $REST_PID $WS_PID; exit" INT

# Wait for both processes
wait
