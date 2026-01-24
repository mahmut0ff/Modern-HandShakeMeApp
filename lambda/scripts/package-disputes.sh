#!/bin/bash

# Package Disputes Module Lambda Functions
# This script creates deployment packages for all dispute handlers

set -e

echo "🔧 Packaging Disputes Module Lambda Functions..."

# Create dist directory if it doesn't exist
mkdir -p ../dist

# Function to package a Lambda function
package_lambda() {
  local handler_file=$1
  local zip_name=$2
  
  echo "📦 Packaging $handler_file -> $zip_name"
  
  # Create temporary directory
  temp_dir=$(mktemp -d)
  
  # Copy handler file
  cp "../core/disputes/$handler_file" "$temp_dir/"
  
  # Copy shared utilities if they exist
  if [ -d "../core/shared" ]; then
    mkdir -p "$temp_dir/shared"
    cp -r ../core/shared/* "$temp_dir/shared/"
  fi
  
  # Copy node_modules (if needed)
  if [ -d "../node_modules" ]; then
    cp -r ../node_modules "$temp_dir/"
  fi
  
  # Create zip file
  cd "$temp_dir"
  zip -r -q "../../dist/$zip_name" .
  cd - > /dev/null
  
  # Clean up
  rm -rf "$temp_dir"
  
  echo "✅ Created ../dist/$zip_name"
}

# Package all dispute handlers
package_lambda "create-dispute.ts" "disputes-create.zip"
package_lambda "get-disputes-dynamodb.ts" "disputes-get-list.zip"
package_lambda "get-dispute-dynamodb.ts" "disputes-get-single.zip"
package_lambda "update-dispute-status.ts" "disputes-update-status.zip"
package_lambda "close-dispute-dynamodb.ts" "disputes-close.zip"
package_lambda "escalate-dispute-dynamodb.ts" "disputes-escalate.zip"
package_lambda "request-mediation-dynamodb.ts" "disputes-mediation.zip"
package_lambda "get-dispute-messages-dynamodb.ts" "disputes-messages-get.zip"
package_lambda "send-dispute-message-dynamodb.ts" "disputes-messages-send.zip"
package_lambda "add-evidence.ts" "disputes-evidence-add.zip"
package_lambda "accept-resolution-dynamodb.ts" "disputes-resolution-accept.zip"

echo ""
echo "✅ All disputes Lambda functions packaged successfully!"
echo "📁 Packages location: ../dist/"
echo ""
echo "Next steps:"
echo "1. cd ../terraform"
echo "2. terraform init"
echo "3. terraform plan"
echo "4. terraform apply"
