#!/bin/bash
set -e

# =============================================================================
# Handshake App - Full Deployment Script
# =============================================================================
# This script deploys the entire Handshake application:
# - Backend: DynamoDB, Lambda functions, API Gateway, Cognito
# - Frontend: S3 + CloudFront (optional)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DYNAMODB_DIR="$PROJECT_ROOT/dynamodb"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Default values
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SKIP_FRONTEND="${SKIP_FRONTEND:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is required but not installed."
        exit 1
    fi
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

preflight_checks() {
    log_info "Running pre-flight checks..."
    
    check_command "node"
    check_command "npm"
    check_command "terraform"
    check_command "aws"
    
    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js 20+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_success "AWS Account: $AWS_ACCOUNT_ID"
    log_success "AWS Region: $AWS_REGION"
    log_success "Environment: $ENVIRONMENT"
}

# =============================================================================
# Backend Deployment
# =============================================================================

build_backend() {
    log_info "Building Lambda functions..."
    
    cd "$DYNAMODB_DIR"
    
    # Install dependencies
    npm install
    
    # Build with esbuild
    npm run build
    
    # Verify dist folder exists
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist folder not created"
        exit 1
    fi
    
    log_success "Lambda functions built successfully"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # S3 backend bucket name
    BACKEND_BUCKET="handshake-terraform-state-$AWS_ACCOUNT_ID"
    BACKEND_KEY="$ENVIRONMENT/terraform.tfstate"
    
    # Create backend bucket if it doesn't exist
    if ! aws s3api head-bucket --bucket "$BACKEND_BUCKET" 2>/dev/null; then
        log_info "Creating Terraform state bucket: $BACKEND_BUCKET"
        aws s3api create-bucket \
            --bucket "$BACKEND_BUCKET" \
            --region "$AWS_REGION" \
            $([ "$AWS_REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$AWS_REGION")
        
        # Enable versioning for state file protection
        aws s3api put-bucket-versioning \
            --bucket "$BACKEND_BUCKET" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "$BACKEND_BUCKET" \
            --server-side-encryption-configuration '{
                "Rules": [{
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            }'
        
        # Block public access
        aws s3api put-public-access-block \
            --bucket "$BACKEND_BUCKET" \
            --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    fi
    
    # Initialize Terraform with S3 backend
    terraform init -upgrade \
        -backend-config="bucket=$BACKEND_BUCKET" \
        -backend-config="key=$BACKEND_KEY" \
        -backend-config="region=$AWS_REGION"
    
    # Plan
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$AWS_REGION" \
        -out=tfplan
    
    # Apply
    if [ "$AUTO_APPROVE" = "true" ]; then
        terraform apply -auto-approve tfplan
    else
        echo ""
        read -p "Do you want to apply these changes? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            terraform apply tfplan
        else
            log_warning "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Clean up plan file
    rm -f tfplan
    
    log_success "Infrastructure deployed successfully"
}

get_outputs() {
    log_info "Retrieving deployment outputs..."
    
    cd "$TERRAFORM_DIR"
    
    API_URL=$(terraform output -raw api_url 2>/dev/null || echo "")
    COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
    COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
    DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
        log_error "Failed to get Terraform outputs"
        exit 1
    fi
    
    # Save outputs to file
    cat > "$PROJECT_ROOT/terraform-outputs.json" << EOF
{
  "api_url": "$API_URL",
  "cognito_user_pool_id": "$COGNITO_USER_POOL_ID",
  "cognito_client_id": "$COGNITO_CLIENT_ID",
  "dynamodb_table_name": "$DYNAMODB_TABLE",
  "aws_region": "$AWS_REGION",
  "environment": "$ENVIRONMENT"
}
EOF
    
    log_success "Outputs saved to terraform-outputs.json"
}

# =============================================================================
# Frontend Deployment
# =============================================================================

build_frontend() {
    log_info "Building frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    npm install
    
    # Create .env file from Terraform outputs
    cat > .env << EOF
VITE_API_URL=$API_URL
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
EOF
    
    # Build
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Frontend build failed"
        exit 1
    fi
    
    log_success "Frontend built successfully"
}

deploy_frontend_amplify() {
    log_info "Deploying frontend to AWS Amplify..."
    
    APP_NAME="handshake-$ENVIRONMENT"
    
    # Check if Amplify app exists
    EXISTING_APP=$(aws amplify list-apps --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")
    
    if [ -z "$EXISTING_APP" ] || [ "$EXISTING_APP" = "None" ]; then
        log_info "Creating Amplify app: $APP_NAME"
        
        # Create Amplify app for manual deployments
        APP_ID=$(aws amplify create-app \
            --name "$APP_NAME" \
            --platform WEB \
            --environment-variables "VITE_API_URL=$API_URL,VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID" \
            --query 'app.appId' \
            --output text)
        
        # Create branch for manual deployments
        aws amplify create-branch \
            --app-id "$APP_ID" \
            --branch-name "$ENVIRONMENT" \
            --stage PRODUCTION \
            --no-enable-auto-build
    else
        APP_ID="$EXISTING_APP"
        log_info "Using existing Amplify app: $APP_ID"
        
        # Update environment variables
        aws amplify update-app \
            --app-id "$APP_ID" \
            --environment-variables "VITE_API_URL=$API_URL,VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID" \
            > /dev/null
        
        # Check if branch exists, create if not
        EXISTING_BRANCH=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$ENVIRONMENT" --query 'branch.branchName' --output text 2>/dev/null || echo "")
        if [ -z "$EXISTING_BRANCH" ] || [ "$EXISTING_BRANCH" = "None" ]; then
            log_info "Creating branch: $ENVIRONMENT"
            aws amplify create-branch \
                --app-id "$APP_ID" \
                --branch-name "$ENVIRONMENT" \
                --stage PRODUCTION \
                --no-enable-auto-build
        fi
    fi
    
    # Create deployment zip
    cd "$FRONTEND_DIR"
    log_info "Creating deployment package..."
    
    # Amplify expects the files in a zip
    cd dist
    zip -r ../deployment.zip . -x "*.map"
    cd ..
    
    # Start deployment
    log_info "Starting Amplify deployment..."
    
    # Create deployment and get both jobId and uploadUrl in one call
    DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
        --app-id "$APP_ID" \
        --branch-name "$ENVIRONMENT" \
        --output json)
    
    DEPLOYMENT_ID=$(echo "$DEPLOYMENT_RESPONSE" | jq -r '.jobId')
    UPLOAD_URL=$(echo "$DEPLOYMENT_RESPONSE" | jq -r '.zipUploadUrl')
    
    # Upload the zip file
    curl -s -X PUT -T deployment.zip -H "Content-Type: application/zip" "$UPLOAD_URL"
    
    # Start the deployment job
    aws amplify start-deployment \
        --app-id "$APP_ID" \
        --branch-name "$ENVIRONMENT" \
        --job-id "$DEPLOYMENT_ID" \
        > /dev/null
    
    # Wait for deployment to complete
    log_info "Waiting for deployment to complete..."
    
    for i in {1..30}; do
        STATUS=$(aws amplify get-job \
            --app-id "$APP_ID" \
            --branch-name "$ENVIRONMENT" \
            --job-id "$DEPLOYMENT_ID" \
            --query 'job.summary.status' \
            --output text 2>/dev/null || echo "PENDING")
        
        if [ "$STATUS" = "SUCCEED" ]; then
            break
        elif [ "$STATUS" = "FAILED" ]; then
            log_error "Amplify deployment failed"
            rm -f deployment.zip
            exit 1
        fi
        
        sleep 5
    done
    
    # Clean up
    rm -f deployment.zip
    
    # Get the app URL
    FRONTEND_URL="https://$ENVIRONMENT.$(aws amplify get-app --app-id "$APP_ID" --query 'app.defaultDomain' --output text)"
    
    log_success "Frontend deployed to: $FRONTEND_URL"
}

# =============================================================================
# Summary
# =============================================================================

print_summary() {
    echo ""
    echo "=============================================="
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo "=============================================="
    echo ""
    echo "Backend:"
    echo "  API URL:           $API_URL"
    echo "  DynamoDB Table:    $DYNAMODB_TABLE"
    echo "  Cognito Pool ID:   $COGNITO_USER_POOL_ID"
    echo "  Cognito Client ID: $COGNITO_CLIENT_ID"
    echo ""
    if [ "$SKIP_FRONTEND" != "true" ] && [ -n "$FRONTEND_URL" ]; then
        echo "Frontend:"
        echo "  URL: $FRONTEND_URL"
        echo ""
    fi
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo ""
    echo "Next steps:"
    echo "  1. Test the API: curl $API_URL/jobs"
    echo "  2. Configure admin users in Terraform variables"
    echo "  3. Set up a custom domain (optional)"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment   Environment (dev, staging, prod) [default: dev]"
    echo "  -r, --region        AWS region [default: us-east-1]"
    echo "  -y, --yes           Auto-approve Terraform changes"
    echo "  --skip-frontend     Skip frontend deployment"
    echo "  --backend-only      Only deploy backend (same as --skip-frontend)"
    echo "  --frontend-only     Only deploy frontend (requires existing backend)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy everything to dev"
    echo "  $0 -e prod -y                # Deploy to prod with auto-approve"
    echo "  $0 --backend-only            # Deploy only backend"
    echo "  $0 --frontend-only           # Deploy only frontend"
}

FRONTEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -y|--yes)
            AUTO_APPROVE=true
            shift
            ;;
        --skip-frontend|--backend-only)
            SKIP_FRONTEND=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
echo ""
echo "=============================================="
echo "  Handshake App Deployment"
echo "=============================================="
echo ""

preflight_checks

if [ "$FRONTEND_ONLY" = "true" ]; then
    # Frontend only - load existing outputs
    if [ -f "$PROJECT_ROOT/terraform-outputs.json" ]; then
        API_URL=$(jq -r '.api_url' "$PROJECT_ROOT/terraform-outputs.json")
        COGNITO_USER_POOL_ID=$(jq -r '.cognito_user_pool_id' "$PROJECT_ROOT/terraform-outputs.json")
        COGNITO_CLIENT_ID=$(jq -r '.cognito_client_id' "$PROJECT_ROOT/terraform-outputs.json")
    else
        log_error "terraform-outputs.json not found. Deploy backend first."
        exit 1
    fi
    build_frontend
    deploy_frontend_amplify
else
    # Backend deployment
    build_backend
    deploy_infrastructure
    get_outputs
    
    # Frontend deployment
    if [ "$SKIP_FRONTEND" != "true" ]; then
        build_frontend
        deploy_frontend_amplify
    fi
fi

print_summary
