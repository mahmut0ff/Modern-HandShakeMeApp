#!/bin/bash
set -e

# =============================================================================
# Handshake App - Destroy Script
# =============================================================================
# This script tears down all deployed resources
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/dynamodb/terraform"

ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=============================================="
echo -e "${RED}  Handshake App - DESTROY${NC}"
echo "=============================================="
echo ""
echo "This will destroy ALL resources for environment: $ENVIRONMENT"
echo ""

if [ "$AUTO_APPROVE" != "true" ]; then
    read -p "Are you SURE you want to destroy everything? (type 'yes' to confirm) " -r
    echo ""
    if [ "$REPLY" != "yes" ]; then
        log_warning "Destroy cancelled"
        exit 0
    fi
fi

# Delete Amplify app (if exists)
APP_NAME="handshake-$ENVIRONMENT"
APP_ID=$(aws amplify list-apps --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -n "$APP_ID" ] && [ "$APP_ID" != "None" ]; then
    log_info "Deleting Amplify app: $APP_NAME"
    aws amplify delete-app --app-id "$APP_ID"
fi

# Destroy Terraform resources
log_info "Destroying Terraform resources..."
cd "$TERRAFORM_DIR"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# S3 backend bucket name
BACKEND_BUCKET="handshake-terraform-state-$AWS_ACCOUNT_ID"
BACKEND_KEY="$ENVIRONMENT/terraform.tfstate"

# Re-init with backend config
terraform init \
    -backend-config="bucket=$BACKEND_BUCKET" \
    -backend-config="key=$BACKEND_KEY" \
    -backend-config="region=$AWS_REGION"

if [ "$AUTO_APPROVE" = "true" ]; then
    terraform destroy -auto-approve \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$AWS_REGION"
else
    terraform destroy \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$AWS_REGION"
fi

# Clean up local files
rm -f "$PROJECT_ROOT/terraform-outputs.json"
rm -f "$PROJECT_ROOT/frontend/.env"

echo ""
echo -e "${GREEN}All resources destroyed successfully${NC}"
