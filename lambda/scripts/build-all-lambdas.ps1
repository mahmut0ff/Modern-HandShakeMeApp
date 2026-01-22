# Build all Lambda functions for deployment
# Creates ZIP files for each Lambda function

Write-Host "Building all Lambda functions..." -ForegroundColor Green

# Create dist directory if it doesn't exist
if (!(Test-Path "../dist")) {
    New-Item -ItemType Directory -Path "../dist"
}

# Phase 1: Auth & Core Functions (19 functions)
Write-Host "`nPhase 1: Building Auth & Core Functions..." -ForegroundColor Cyan

# Auth functions
Write-Host "Building auth-refresh..."
Compress-Archive -Path "../dist/auth/refresh-token-dynamodb.js" -DestinationPath "../dist/auth-refresh.zip" -Force

Write-Host "Building auth-logout..."
Compress-Archive -Path "../dist/auth/logout-dynamodb.js" -DestinationPath "../dist/auth-logout.zip" -Force

Write-Host "Building auth-login..."
Compress-Archive -Path "../dist/auth/login-dynamodb.js" -DestinationPath "../dist/auth-login.zip" -Force

Write-Host "Building auth-register..."
Compress-Archive -Path "../dist/auth/register-dynamodb.js" -DestinationPath "../dist/auth-register.zip" -Force

# User functions
Write-Host "Building users-me-get..."
Compress-Archive -Path "../dist/profiles/get-current-user-dynamodb.js" -DestinationPath "../dist/users-me-get.zip" -Force

Write-Host "Building users-me-update..."
Compress-Archive -Path "../dist/profiles/update-current-user-dynamodb.js" -DestinationPath "../dist/users-me-update.zip" -Force

# Profile functions
Write-Host "Building profiles-master-get..."
Compress-Archive -Path "../dist/profiles/get-master-profile-dynamodb.js" -DestinationPath "../dist/profiles-master-get.zip" -Force

Write-Host "Building profiles-master-me..."
Compress-Archive -Path "../dist/profiles/get-my-master-profile-dynamodb.js" -DestinationPath "../dist/profiles-master-me.zip" -Force

Write-Host "Building profiles-master-update..."
Compress-Archive -Path "../dist/profiles/update-master-profile-dynamodb.js" -DestinationPath "../dist/profiles-master-update.zip" -Force

Write-Host "Building profiles-client-me..."
Compress-Archive -Path "../dist/profiles/get-my-client-profile-dynamodb.js" -DestinationPath "../dist/profiles-client-me.zip" -Force

Write-Host "Building profiles-client-update..."
Compress-Archive -Path "../dist/profiles/update-client-profile-dynamodb.js" -DestinationPath "../dist/profiles-client-update.zip" -Force

# Order functions
Write-Host "Building orders-list..."
Compress-Archive -Path "../dist/orders/list-orders-dynamodb.js" -DestinationPath "../dist/orders-list.zip" -Force

Write-Host "Building orders-my..."
Compress-Archive -Path "../dist/orders/get-my-orders-dynamodb.js" -DestinationPath "../dist/orders-my.zip" -Force

Write-Host "Building orders-create..."
Compress-Archive -Path "../dist/orders/create-order-dynamodb.js" -DestinationPath "../dist/orders-create.zip" -Force

Write-Host "Building orders-get..."
Compress-Archive -Path "../dist/orders/get-order-dynamodb.js" -DestinationPath "../dist/orders-get.zip" -Force

Write-Host "Building orders-update..."
Compress-Archive -Path "../dist/orders/update-order-dynamodb.js" -DestinationPath "../dist/orders-update.zip" -Force

# Application functions
Write-Host "Building applications-create..."
Compress-Archive -Path "../dist/applications/create-application-dynamodb.js" -DestinationPath "../dist/applications-create.zip" -Force

Write-Host "Building applications-my..."
Compress-Archive -Path "../dist/applications/get-my-applications-dynamodb.js" -DestinationPath "../dist/applications-my.zip" -Force

Write-Host "Building applications-respond..."
Compress-Archive -Path "../dist/applications/respond-to-application-dynamodb.js" -DestinationPath "../dist/applications-respond.zip" -Force

# Phase 2: Critical Functions (15 functions)
Write-Host "`nPhase 2: Building Critical Functions..." -ForegroundColor Cyan

# File upload functions
Write-Host "Building users-avatar-upload..."
Compress-Archive -Path "../dist/profiles/upload-avatar-dynamodb.js" -DestinationPath "../dist/users-avatar-upload.zip" -Force

Write-Host "Building users-avatar-delete..."
Compress-Archive -Path "../dist/profiles/delete-avatar-dynamodb.js" -DestinationPath "../dist/users-avatar-delete.zip" -Force

Write-Host "Building orders-files-upload..."
Compress-Archive -Path "../dist/orders/upload-order-file-dynamodb.js" -DestinationPath "../dist/orders-files-upload.zip" -Force

Write-Host "Building orders-files-get..."
Compress-Archive -Path "../dist/orders/get-order-files-dynamodb.js" -DestinationPath "../dist/orders-files-get.zip" -Force

Write-Host "Building chat-send-image..."
Compress-Archive -Path "../dist/chat/send-image-dynamodb.js" -DestinationPath "../dist/chat-send-image.zip" -Force

# Search functions
Write-Host "Building services-search..."
Compress-Archive -Path "../dist/services/search-services-dynamodb.js" -DestinationPath "../dist/services-search.zip" -Force

Write-Host "Building masters-search..."
Compress-Archive -Path "../dist/profiles/search-masters-dynamodb.js" -DestinationPath "../dist/masters-search.zip" -Force

Write-Host "Building orders-search..."
Compress-Archive -Path "../dist/orders/search-orders-dynamodb.js" -DestinationPath "../dist/orders-search.zip" -Force

# Statistics functions
Write-Host "Building masters-stats..."
Compress-Archive -Path "../dist/profiles/get-master-stats-dynamodb.js" -DestinationPath "../dist/masters-stats.zip" -Force

Write-Host "Building wallet-stats..."
Compress-Archive -Path "../dist/wallet/get-wallet-stats-dynamodb.js" -DestinationPath "../dist/wallet-stats.zip" -Force

Write-Host "Building reviews-stats..."
Compress-Archive -Path "../dist/reviews/get-review-stats-dynamodb.js" -DestinationPath "../dist/reviews-stats.zip" -Force

# Additional critical functions
Write-Host "Building orders-favorite-add..."
Compress-Archive -Path "../dist/orders/add-to-favorites-dynamodb.js" -DestinationPath "../dist/orders-favorite-add.zip" -Force

Write-Host "Building orders-favorite-remove..."
Compress-Archive -Path "../dist/orders/remove-from-favorites-dynamodb.js" -DestinationPath "../dist/orders-favorite-remove.zip" -Force

Write-Host "Building wallet-payment-methods-create..."
Compress-Archive -Path "../dist/wallet/create-payment-method-dynamodb.js" -DestinationPath "../dist/wallet-payment-methods-create.zip" -Force

Write-Host "Building wallet-send-payment..."
Compress-Archive -Path "../dist/wallet/send-payment-dynamodb.js" -DestinationPath "../dist/wallet-send-payment.zip" -Force

Write-Host "`nBuild complete! All 34 Lambda functions packaged." -ForegroundColor Green
Write-Host "ZIP files created in: ../dist/" -ForegroundColor Yellow
