@echo off
echo ========================================
echo   HandShakeMe Development Server
echo ========================================
echo.

cd lambda

echo Starting REST API Server (port 3000)...
start "REST API" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo Starting WebSocket Server (port 3001)...
start "WebSocket" cmd /k "npm run dev:ws"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo   REST API:  http://localhost:3000
echo   WebSocket: ws://localhost:3001
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

taskkill /FI "WindowTitle eq REST API*" /T /F
taskkill /FI "WindowTitle eq WebSocket*" /T /F
