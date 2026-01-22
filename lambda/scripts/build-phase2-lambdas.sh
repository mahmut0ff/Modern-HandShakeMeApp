#!/bin/bash

# Build Phase 2 Critical Features Lambda Functions
# File uploads, Search, Statistics, Favorites, Payment Methods

set -e

echo "🚀 Building Phase 2 Lambda Functions..."

DIST_DIR="../dist"
mkdir -p "$DIST_DIR"

# File Uploads (5 functions)
echo "📦 Building file upload functions..."
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

echo "✅ Phase 2 Lambda functions built successfully!"
echo "📦 15 ZIP files created in $DIST_DIR"
