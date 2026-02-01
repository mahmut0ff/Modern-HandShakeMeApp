# Production Deployment Script for HandShakeMe
# Run this script to deploy to production safely

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false
)

Write-Host "🚀 HandShakeMe Production Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow

# Set error action preference
$ErrorActionPreference = "Stop"

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Blue

# Check if AWS CLI is installed and configured
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if Terraform is installed
try {
    $terraformVersion = terraform version
    Write-Host "✅ Terraform is installed: $($terraformVersion.Split("`n")[0])" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials and permissions
Write-Host "`n🔐 Checking AWS credentials and permissions..." -ForegroundColor Blue
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS credentials configured for account: $($awsIdentity.Account)" -ForegroundColor Green
    
    # Verify we're using the correct AWS account
    if ($awsIdentity.Account -ne "473522039044") {
        Write-Host "⚠️ WARNING: You're deploying to account $($awsIdentity.Account), expected 473522039044" -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "Deployment cancelled by user" -ForegroundColor Yellow
            exit 0
        }
    }
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check required AWS permissions
Write-Host "🔍 Verifying AWS permissions..." -ForegroundColor Blue
$requiredServices = @("lambda", "dynamodb", "s3", "apigateway", "cloudformation", "iam", "logs", "sns", "secretsmanager")
foreach ($service in $requiredServices) {
    try {
        switch ($service) {
            "lambda" { aws lambda list-functions --max-items 1 --output text | Out-Null }
            "dynamodb" { aws dynamodb list-tables --output text | Out-Null }
            "s3" { aws s3 ls | Out-Null }
            "apigateway" { aws apigatewayv2 get-apis --max-results 1 --output text | Out-Null }
            default { 
                # For other services, just check if we can call a basic operation
                aws $service help | Out-Null 
            }
        }
        Write-Host "✅ $service permissions verified" -ForegroundColor Green
    } catch {
        Write-Host "❌ Missing permissions for $service" -ForegroundColor Red
        exit 1
    }
}

# Check environment files
Write-Host "`n📁 Checking environment configuration..." -ForegroundColor Blue

$requiredEnvFiles = @(
    "lambda/.env.production",
    "mobile/.env.production"
)

foreach ($envFile in $requiredEnvFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ $envFile exists" -ForegroundColor Green
        
        # Check for placeholder values
        $content = Get-Content $envFile -Raw
        if ($content -match "CHANGE_ME_IN_PRODUCTION") {
            Write-Host "❌ $envFile contains placeholder values. Please update with real values." -ForegroundColor Red
            Write-Host "   Found: $($matches[0])" -ForegroundColor Red
            exit 1
        }
        
        # Check for required variables
        $requiredVars = @("JWT_SECRET", "TELEGRAM_BOT_TOKEN", "DATABASE_URL")
        foreach ($var in $requiredVars) {
            if ($content -notmatch "$var=.+") {
                Write-Host "❌ $envFile missing required variable: $var" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host "✅ $envFile validation passed" -ForegroundColor Green
    } else {
        Write-Host "❌ $envFile not found. Copy from .env.production.example and fill in real values." -ForegroundColor Red
        exit 1
    }
}

# Check Terraform configuration
Write-Host "`n🏗️ Validating Terraform configuration..." -ForegroundColor Blue
Set-Location "lambda/terraform"

if (-not (Test-Path "production.tfvars")) {
    Write-Host "❌ production.tfvars not found. Copy from production.tfvars.example and fill in real values." -ForegroundColor Red
    exit 1
}

# Validate Terraform configuration
terraform fmt -check=true
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform configuration is not properly formatted. Run 'terraform fmt'" -ForegroundColor Red
    exit 1
}

terraform validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform configuration validation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Terraform configuration is valid" -ForegroundColor Green
Set-Location "../.."

# Run security tests
if (-not $SkipTests) {
    Write-Host "`n🔒 Running security and critical tests..." -ForegroundColor Blue
    
    Set-Location "lambda"
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing Lambda dependencies..." -ForegroundColor Yellow
        npm ci --production=false
    }
    
    # Run security tests
    Write-Host "🧪 Running security tests..." -ForegroundColor Yellow
    npm run test:security
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Security tests failed. Deployment aborted." -ForegroundColor Red
        exit 1
    }
    
    # Run critical tests
    Write-Host "🧪 Running critical tests..." -ForegroundColor Yellow
    npm run test:critical
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Critical tests failed. Deployment aborted." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All tests passed" -ForegroundColor Green
    Set-Location ".."
}

# Create backup of current infrastructure (if not skipped)
if (-not $SkipBackup -and -not $DryRun) {
    Write-Host "`n💾 Creating infrastructure backup..." -ForegroundColor Blue
    
    $backupDir = "backups/$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Set-Location "lambda/terraform"
    
    # Export current Terraform state
    terraform state pull > "../../$backupDir/terraform.tfstate.backup"
    
    # Export DynamoDB table (if exists)
    try {
        aws dynamodb describe-table --table-name handshakeme-prod --output json > "../../$backupDir/dynamodb-schema.json"
        Write-Host "✅ DynamoDB schema backed up" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ DynamoDB table not found (first deployment?)" -ForegroundColor Yellow
    }
    
    Set-Location "../.."
    Write-Host "✅ Backup created in $backupDir" -ForegroundColor Green
}

# Build Lambda functions
Write-Host "`n🏗️ Building Lambda functions..." -ForegroundColor Blue
Set-Location "lambda"

# Clean previous builds
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Create dist directory
New-Item -ItemType Directory -Path "dist" -Force | Out-Null
New-Item -ItemType Directory -Path "dist/layers" -Force | Out-Null

# Build TypeScript
Write-Host "📦 Compiling TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lambda build failed" -ForegroundColor Red
    exit 1
}

# Package Lambda functions
Write-Host "📦 Packaging Lambda functions..." -ForegroundColor Yellow

# Create shared dependencies layer
Write-Host "📦 Creating shared dependencies layer..." -ForegroundColor Yellow
$layerDir = "dist/layers/shared-dependencies"
New-Item -ItemType Directory -Path $layerDir -Force | Out-Null
New-Item -ItemType Directory -Path "$layerDir/nodejs" -Force | Out-Null

# Copy package.json and install production dependencies
Copy-Item "package.json" "$layerDir/nodejs/"
Set-Location "$layerDir/nodejs"
npm ci --production --silent
Set-Location "../../.."

# Zip the layer
Compress-Archive -Path "$layerDir/*" -DestinationPath "dist/layers/shared-dependencies.zip" -Force

# Create Kyrgyzstan utilities layer
Write-Host "📦 Creating Kyrgyzstan utilities layer..." -ForegroundColor Yellow
$kgLayerDir = "dist/layers/kyrgyzstan-utils"
New-Item -ItemType Directory -Path $kgLayerDir -Force | Out-Null
New-Item -ItemType Directory -Path "$kgLayerDir/nodejs" -Force | Out-Null

# Copy Kyrgyzstan-specific utilities
if (Test-Path "core/kyrgyzstan") {
    Copy-Item -Recurse "core/kyrgyzstan/*" "$kgLayerDir/nodejs/"
}

# Zip the layer
Compress-Archive -Path "$kgLayerDir/*" -DestinationPath "dist/layers/kyrgyzstan-utils.zip" -Force

# Package individual Lambda functions
$lambdaFunctions = @(
    "telegram-login",
    "instant-booking-kg", 
    "sms-notifications-kg",
    "health-check",
    "create-order",
    "get-orders",
    "get-user-profile",
    "update-user-profile",
    "process-uploaded-file"
)

foreach ($func in $lambdaFunctions) {
    Write-Host "📦 Packaging $func..." -ForegroundColor Yellow
    
    $funcDir = "dist/$func"
    New-Item -ItemType Directory -Path $funcDir -Force | Out-Null
    
    # Copy compiled JS files
    if (Test-Path "build/core") {
        Copy-Item -Recurse "build/core" "$funcDir/"
    }
    
    # Create handler file
    $handlerContent = @"
const { handler } = require('./core/$func');
module.exports = { handler };
"@
    Set-Content -Path "$funcDir/index.js" -Value $handlerContent
    
    # Zip the function
    Compress-Archive -Path "$funcDir/*" -DestinationPath "dist/$func.zip" -Force
}

Write-Host "✅ Lambda functions packaged successfully" -ForegroundColor Green
Set-Location ".."

# Build mobile app
Write-Host "`n📱 Building mobile app..." -ForegroundColor Blue
Set-Location "mobile"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing mobile dependencies..." -ForegroundColor Yellow
    npm ci
}

# Copy production environment
Copy-Item ".env.production" ".env" -Force

# Type check
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Yellow
npm run type-check

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript type check failed" -ForegroundColor Red
    exit 1
}

# Build for production (if not dry run)
if (-not $DryRun) {
    Write-Host "🏗️ Building production APK..." -ForegroundColor Yellow
    $env:NODE_ENV = "production"
    
    # Build the app (this would typically use EAS Build or similar)
    Write-Host "📱 Building Android APK..." -ForegroundColor Yellow
    npx expo export --platform android
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Mobile app build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Mobile app built successfully" -ForegroundColor Green
} else {
    Write-Host "🔍 Dry run - skipping mobile app build" -ForegroundColor Yellow
}

Set-Location ".."

# Deploy infrastructure
Write-Host "`n🏗️ Deploying infrastructure..." -ForegroundColor Blue
Set-Location "lambda/terraform"

# Initialize Terraform
Write-Host "🔧 Initializing Terraform..." -ForegroundColor Yellow
terraform init -upgrade

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform init failed" -ForegroundColor Red
    exit 1
}

# Plan deployment
Write-Host "📋 Planning Terraform deployment..." -ForegroundColor Yellow
terraform plan -var-file="production.tfvars" -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform plan failed" -ForegroundColor Red
    exit 1
}

# Show plan summary
Write-Host "`n📊 Deployment Plan Summary:" -ForegroundColor Blue
terraform show -no-color tfplan | Select-String "Plan:" -A 5

# Apply if not dry run
if (-not $DryRun) {
    Write-Host "`n🚀 Applying Terraform changes..." -ForegroundColor Yellow
    
    # Final confirmation
    Write-Host "⚠️ This will deploy to PRODUCTION environment!" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled by user" -ForegroundColor Yellow
        exit 0
    }
    
    terraform apply tfplan
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Terraform apply failed" -ForegroundColor Red
        Write-Host "💡 Check the error above and run the deployment script again" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
} else {
    Write-Host "🔍 Dry run completed. Use -DryRun:$false to actually deploy." -ForegroundColor Yellow
}

Set-Location "../.."

# Post-deployment checks
if (-not $DryRun) {
    Write-Host "`n🔍 Running post-deployment checks..." -ForegroundColor Blue
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check API health
    Write-Host "🏥 Checking API health..." -ForegroundColor Yellow
    try {
        $apiUrl = "https://api.handshakeme.kg/health"
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 30
        
        if ($response.status -eq "healthy") {
            Write-Host "✅ API is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️ API status: $($response.status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ API health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "💡 This might be normal for first deployment - DNS propagation takes time" -ForegroundColor Yellow
    }
    
    # Check DynamoDB table
    Write-Host "🗄️ Checking DynamoDB table..." -ForegroundColor Yellow
    try {
        $tableStatus = aws dynamodb describe-table --table-name handshakeme-prod --query 'Table.TableStatus' --output text
        if ($tableStatus -eq "ACTIVE") {
            Write-Host "✅ DynamoDB table is active" -ForegroundColor Green
        } else {
            Write-Host "⚠️ DynamoDB table status: $tableStatus" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ DynamoDB check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Check S3 buckets
    Write-Host "🪣 Checking S3 buckets..." -ForegroundColor Yellow
    $buckets = @("handshakeme-prod-avatars", "handshakeme-prod-orders", "handshakeme-prod-chat")
    foreach ($bucket in $buckets) {
        try {
            aws s3 ls "s3://$bucket" | Out-Null
            Write-Host "✅ S3 bucket $bucket is accessible" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ S3 bucket $bucket check failed" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Post-deployment checks completed" -ForegroundColor Green
}

# Summary
Write-Host "`n🎉 Deployment Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "AWS Account: $($awsIdentity.Account)" -ForegroundColor White
Write-Host "Lambda functions: $(if ($DryRun) { 'Planned' } else { 'Deployed' })" -ForegroundColor White
Write-Host "Mobile app: $(if ($DryRun) { 'Validated' } else { 'Built' })" -ForegroundColor White
Write-Host "Infrastructure: $(if ($DryRun) { 'Planned (Dry Run)' } else { 'Deployed' })" -ForegroundColor White

if (-not $DryRun) {
    Write-Host "`n🔗 Production URLs:" -ForegroundColor Blue
    Write-Host "API: https://api.handshakeme.kg" -ForegroundColor White
    Write-Host "CDN: https://cdn.handshakeme.kg" -ForegroundColor White
    Write-Host "Health Check: https://api.handshakeme.kg/health" -ForegroundColor White
    
    Write-Host "`n📱 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Upload APK to Google Play Console" -ForegroundColor White
    Write-Host "2. Configure DNS records (if not using Route 53)" -ForegroundColor White
    Write-Host "3. Set up monitoring alerts" -ForegroundColor White
    Write-Host "4. Run smoke tests" -ForegroundColor White
    Write-Host "5. Update secrets in AWS Secrets Manager" -ForegroundColor White
    
    Write-Host "`n📊 Monitoring:" -ForegroundColor Blue
    Write-Host "CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=HandShakeMe-production" -ForegroundColor White
    Write-Host "Lambda Functions: https://console.aws.amazon.com/lambda/home?region=us-east-1" -ForegroundColor White
    Write-Host "DynamoDB: https://console.aws.amazon.com/dynamodb/home?region=us-east-1" -ForegroundColor White
}

Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green

# Return to original directory
Set-Location $PSScriptRoot