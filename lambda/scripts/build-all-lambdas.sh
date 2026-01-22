#!/bin/bash

# Build ALL Lambda Functions (Phase 1 + Phase 2)
# Complete build script for production deployment

set -e

echo "🚀 Building ALL Lambda Functions..."
echo "=================================="

DIST_DIR="../dist"
mkdir -p "$DIST_DIR"

# ============================================
# PHASE 1: Core Endpoints (19 functions)
# ============================================

echo ""
echo "📦 Phase 1: Core Endpoints"
echo "=================================="

# Auth (4 functions)
echo "🔐 Building auth functions..."
zip -r "$DIST_DIR/register.zip" core/auth/register-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/login.zip" core/auth/login-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/refresh-token.zip" core/auth/refresh-token-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/logout.zip" core/auth/logout-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Profiles (5 functions)
echo "👤 Building profile functions..."
zip -r "$DIST_DIR/get-current-user.zip" core/profiles/get-current-user-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/update-current-user.zip" core/profiles/update-current-user-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-master-profile.zip" core/profiles/get-master-profile-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-my-master-profile.zip" core/profiles/get-my-master-profile-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/update-master-profile.zip" core/profiles/update-master-profile-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Orders (2 functions)
echo "📋 Building order functions..."
zip -r "$DIST_DIR/list-orders.zip" core/orders/list-orders-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/create-order.zip" core/orders/create-order-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Applications (2 functions)
echo "📝 Building application functions..."
zip -r "$DIST_DIR/list-applications.zip" core/applications/list-applications-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/create-application.zip" core/applications/create-application-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Projects (2 functions)
echo "🏗️ Building project functions..."
zip -r "$DIST_DIR/list-projects.zip" core/projects/list-projects-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-project.zip" core/projects/get-project-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Services (1 function)
echo "🛠️ Building service functions..."
zip -r "$DIST_DIR/list-services.zip" core/services/list-services-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Reviews (1 function)
echo "⭐ Building review functions..."
zip -r "$DIST_DIR/list-reviews.zip" core/reviews/list-reviews-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Chat (1 function)
echo "💬 Building chat functions..."
zip -r "$DIST_DIR/list-rooms.zip" core/chat/list-rooms-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Wallet (1 function)
echo "💰 Building wallet functions..."
zip -r "$DIST_DIR/get-wallet.zip" core/wallet/get-wallet-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

echo "✅ Phase 1: 19 functions built"

# ============================================
# PHASE 2: Critical Features (15 functions)
# ============================================

echo ""
echo "📦 Phase 2: Critical Features"
echo "=================================="

# File Uploads (5 functions)
echo "📤 Building file upload functions..."
zip -r "$DIST_DIR/upload-avatar.zip" core/profiles/upload-avatar-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/delete-avatar.zip" core/profiles/delete-avatar-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/upload-order-file.zip" core/orders/upload-order-file-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-order-files.zip" core/orders/get-order-files-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/send-image.zip" core/chat/send-image-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Search (3 functions)
echo "🔍 Building search functions..."
zip -r "$DIST_DIR/search-services.zip" core/services/search-services-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/search-masters.zip" core/profiles/search-masters-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/search-orders.zip" core/orders/search-orders-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Statistics (3 functions)
echo "📊 Building statistics functions..."
zip -r "$DIST_DIR/get-master-stats.zip" core/profiles/get-master-stats-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-wallet-stats.zip" core/wallet/get-wallet-stats-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/get-review-stats.zip" core/reviews/get-review-stats-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Favorites (2 functions)
echo "⭐ Building favorites functions..."
zip -r "$DIST_DIR/add-to-favorites.zip" core/orders/add-to-favorites-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/remove-from-favorites.zip" core/orders/remove-from-favorites-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

# Payment Methods (2 functions)
echo "💳 Building payment functions..."
zip -r "$DIST_DIR/create-payment-method.zip" core/wallet/create-payment-method-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"
zip -r "$DIST_DIR/send-payment.zip" core/wallet/send-payment-dynamodb.ts core/shared/ node_modules/ -x "*.test.ts" "*.spec.ts"

echo "✅ Phase 2: 15 functions built"

# ============================================
# SUMMARY
# ============================================

echo ""
echo "=================================="
echo "✅ ALL LAMBDA FUNCTIONS BUILT!"
echo "=================================="
echo ""
echo "📊 Summary:"
echo "  Phase 1: 19 functions"
echo "  Phase 2: 15 functions"
echo "  Total:   34 functions"
echo ""
echo "📦 All ZIP files created in: $DIST_DIR"
echo ""
echo "🚀 Ready for Terraform deployment!"
echo ""
