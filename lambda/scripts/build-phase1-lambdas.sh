#!/bin/bash

# Build Phase 1 Lambda Functions
# This script creates ZIP files for all Phase 1 Lambda functions

set -e

echo "Building Phase 1 Lambda Functions..."

# Create dist directory
mkdir -p dist

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

# Function to create Lambda ZIP
create_lambda_zip() {
  local name=$1
  local handler=$2
  local dir=$3
  
  echo "Creating $name.zip..."
  
  cd $dir
  zip -r ../../../dist/$name.zip . -x "*.ts" "*.map" "node_modules/*"
  cd ../../..
}

# Auth Functions
create_lambda_zip "auth-refresh" "refresh-token-dynamodb.handler" "core/auth"
create_lambda_zip "auth-logout" "logout-dynamodb.handler" "core/auth"

# User Management
create_lambda_zip "users-me-get" "get-current-user-dynamodb.handler" "core/profiles"
create_lambda_zip "users-me-update" "update-current-user-dynamodb.handler" "core/profiles"

# Master Profiles
create_lambda_zip "masters-get" "get-master-profile-dynamodb.handler" "core/profiles"
create_lambda_zip "masters-me-get" "get-my-master-profile-dynamodb.handler" "core/profiles"
create_lambda_zip "masters-me-update" "update-master-profile-dynamodb.handler" "core/profiles"

# Client Profiles
create_lambda_zip "clients-me-get" "get-my-client-profile-dynamodb.handler" "core/profiles"
create_lambda_zip "clients-me-update" "update-client-profile-dynamodb.handler" "core/profiles"

# Orders
create_lambda_zip "orders-my" "get-my-orders-dynamodb.handler" "core/orders"

# Chat
create_lambda_zip "chat-rooms-list" "list-rooms-dynamodb.handler" "core/chat"
create_lambda_zip "chat-room-get" "get-room-dynamodb.handler" "core/chat"

# Notifications
create_lambda_zip "notifications-unread-count" "get-unread-count-dynamodb.handler" "core/notifications"

# Applications
create_lambda_zip "applications-update" "update-application-dynamodb.handler" "core/applications"
create_lambda_zip "applications-delete" "delete-application-dynamodb.handler" "core/applications"

# Projects
create_lambda_zip "projects-cancel" "cancel-project-dynamodb.handler" "core/projects"

# Services
create_lambda_zip "service-categories-list" "list-service-categories-dynamodb.handler" "core/services"

# Reviews
create_lambda_zip "reviews-update" "update-review-dynamodb.handler" "core/reviews"

# Wallet
create_lambda_zip "wallet-payment-methods-get" "get-payment-methods-dynamodb.handler" "core/wallet"

echo "✅ All Lambda ZIPs created in dist/ directory"
echo "Total: 19 Lambda functions"
