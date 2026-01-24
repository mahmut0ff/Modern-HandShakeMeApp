# Verify Disputes Module Deployment (PowerShell)
# This script checks if all Lambda functions and API routes are deployed correctly

param(
    [string]$ProjectName = "handshake",
    [string]$Environment = "prod",
    [Parameter(Mandatory=$true)]
    [string]$ApiId
)

Write-Host "🔍 Verifying Disputes Module Deployment..." -ForegroundColor Cyan
Write-Host ""

# Function to check Lambda function
function Test-LambdaFunction {
    param([string]$FunctionName)
    
    try {
        aws lambda get-function --function-name $FunctionName 2>&1 | Out-Null
        Write-Host "✅ Lambda: $FunctionName" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Lambda: $FunctionName (NOT FOUND)" -ForegroundColor Red
        return $false
    }
}

# Function to check API route
function Test-ApiRoute {
    param([string]$RouteKey)
    
    $result = aws apigatewayv2 get-routes --api-id $ApiId --query "Items[?RouteKey=='$RouteKey'].RouteKey" --output text 2>&1
    
    if ($result -match $RouteKey) {
        Write-Host "✅ Route: $RouteKey" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ Route: $RouteKey (NOT FOUND)" -ForegroundColor Red
        return $false
    }
}

# Check Lambda Functions
Write-Host "📦 Checking Lambda Functions..." -ForegroundColor Yellow
Write-Host ""

$lambdaCount = 0
$lambdaSuccess = 0

$functions = @(
    "$ProjectName-create-dispute-$Environment",
    "$ProjectName-get-disputes-$Environment",
    "$ProjectName-get-dispute-$Environment",
    "$ProjectName-update-dispute-status-$Environment",
    "$ProjectName-close-dispute-$Environment",
    "$ProjectName-escalate-dispute-$Environment",
    "$ProjectName-request-mediation-$Environment",
    "$ProjectName-get-dispute-messages-$Environment",
    "$ProjectName-send-dispute-message-$Environment",
    "$ProjectName-add-evidence-$Environment",
    "$ProjectName-accept-resolution-$Environment"
)

foreach ($func in $functions) {
    $lambdaCount++
    if (Test-LambdaFunction $func) {
        $lambdaSuccess++
    }
}

Write-Host ""
Write-Host "Lambda Functions: $lambdaSuccess/$lambdaCount" -ForegroundColor Cyan
Write-Host ""

# Check API Routes
Write-Host "🌐 Checking API Gateway Routes..." -ForegroundColor Yellow
Write-Host ""

$routeCount = 0
$routeSuccess = 0

$routes = @(
    "POST /disputes",
    "GET /disputes",
    "GET /disputes/{id}",
    "PATCH /disputes/{id}/status",
    "POST /disputes/{id}/close",
    "POST /disputes/{id}/escalate",
    "POST /disputes/{id}/mediate",
    "GET /disputes/{id}/messages",
    "POST /disputes/{id}/messages",
    "POST /disputes/{id}/evidence",
    "POST /disputes/{id}/accept"
)

foreach ($route in $routes) {
    $routeCount++
    if (Test-ApiRoute $route) {
        $routeSuccess++
    }
}

Write-Host ""
Write-Host "API Routes: $routeSuccess/$routeCount" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Lambda Functions: $lambdaSuccess/$lambdaCount"
Write-Host "API Routes: $routeSuccess/$routeCount"
Write-Host ""

$totalSuccess = $lambdaSuccess + $routeSuccess
$totalCount = $lambdaCount + $routeCount

if ($totalSuccess -eq $totalCount) {
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All disputes module components are deployed correctly."
    exit 0
}
else {
    Write-Host "❌ Deployment Incomplete" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some components are missing. Please check the errors above."
    exit 1
}
