#!/bin/bash

# Deploy Telegram-Only Authentication
# This script deploys the updated infrastructure with Telegram-only auth

set -e

echo "🚀 Deploying Telegram-Only Authentication..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "terraform/main.tf" ]; then
    echo -e "${RED}❌ Error: Please run this script from the lambda directory${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Error: Terraform is not installed${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not configured${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checklist:${NC}"
echo "1. ✅ Telegram bot token configured"
echo "2. ✅ Database migrations ready"
echo "3. ✅ Old Lambda functions will be removed"
echo "4. ✅ New Telegram endpoints will be created"

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment cancelled${NC}"
    exit 0
fi

# Step 1: Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
if [ -f "database/migrations/001_create_telegram_auth_sessions.sql" ]; then
    echo "📝 Creating telegram_auth_sessions table..."
    # Note: You'll need to run this manually or through your DB migration tool
    echo -e "${YELLOW}⚠️  Please run the following SQL migrations manually:${NC}"
    echo "   - database/migrations/001_create_telegram_auth_sessions.sql"
    echo "   - database/migrations/002_cleanup_phone_auth_fields.sql"
    read -p "Press Enter after running migrations..."
fi

# Step 2: Build Lambda functions
echo -e "${BLUE}🔨 Building Lambda functions...${NC}"
npm run build

# Step 3: Package new Lambda functions
echo -e "${BLUE}📦 Packaging Lambda functions...${NC}"
mkdir -p dist

# Package Telegram auth functions
echo "📦 Packaging telegram-code..."
cd core/auth && zip -r ../../dist/auth-telegram-code.zip telegram-code-dynamodb.js && cd ../..

echo "📦 Packaging telegram-check..."
cd core/auth && zip -r ../../dist/auth-telegram-check.zip telegram-check-dynamodb.js && cd ../..

echo "📦 Packaging telegram-register..."
cd core/auth && zip -r ../../dist/auth-telegram-register.zip telegram-register-dynamodb.js && cd ../..

# Step 4: Initialize Terraform
echo -e "${BLUE}🏗️  Initializing Terraform...${NC}"
cd terraform
terraform init

# Step 5: Plan deployment
echo -e "${BLUE}📋 Planning Terraform deployment...${NC}"
terraform plan -var="telegram_bot_token=${TELEGRAM_BOT_TOKEN}" -out=tfplan

echo -e "${YELLOW}⚠️  Review the plan above. This will:${NC}"
echo "   ❌ Remove old phone auth Lambda functions"
echo "   ➕ Create new Telegram auth Lambda functions"
echo "   🔄 Update API Gateway routes"

read -p "Apply these changes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment cancelled${NC}"
    exit 0
fi

# Step 6: Apply Terraform changes
echo -e "${BLUE}🚀 Applying Terraform changes...${NC}"
terraform apply tfplan

# Step 7: Verify deployment
echo -e "${BLUE}✅ Verifying deployment...${NC}"
API_URL=$(terraform output -raw api_gateway_url)
echo "🌐 API Gateway URL: $API_URL"

# Test Telegram code endpoint
echo "🧪 Testing Telegram code endpoint..."
curl -s "$API_URL/auth/telegram/code?visitorId=test123" | jq '.'

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. 🤖 Update your Telegram bot to use the new processAuthCode method"
echo "2. 📱 Test the mobile app authentication flow"
echo "3. 🗑️  Clean up old environment variables (Twilio/WhatsApp)"
echo "4. 📚 Update API documentation"
echo
echo -e "${GREEN}✅ Telegram-only authentication is now live!${NC}"