# HandShakeMe - Auto Deploy to AWS Lambda
# Usage: .\auto-deploy.ps1
# Requirements: AWS CLI, Terraform, Node.js 18+

param(
    [switch]$SkipTests,
    [switch]$AutoApprove,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HandShakeMe - AWS Lambda Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
Write-Step "Checking dependencies"

$awsOk = $false
try { aws --version 2>$null | Out-Null; $awsOk = $true } catch {}
if ($awsOk) { Write-Success "AWS CLI installed" } else { Write-Err "AWS CLI not installed"; exit 1 }

$tfOk = $false
try { terraform version 2>$null | Out-Null; $tfOk = $true } catch {}
if ($tfOk) { Write-Success "Terraform installed" } else { Write-Err "Terraform not installed"; exit 1 }

$nodeOk = $false
try { node --version 2>$null | Out-Null; $nodeOk = $true } catch {}
if ($nodeOk) { Write-Success "Node.js installed" } else { Write-Err "Node.js not installed"; exit 1 }

try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    Write-Success "AWS credentials OK - Account: $($identity.Account)"
} catch {
    Write-Err "AWS credentials not configured. Run: aws configure"
    exit 1
}

# Load config
Write-Step "Loading configuration"

if (-not (Test-Path "deploy-config.json")) {
    Write-Err "deploy-config.json not found!"
    exit 1
}

$config = Get-Content "deploy-config.json" -Raw | ConvertFrom-Json
$d = $config.deployment
Write-Success "Configuration loaded"

# Validate required fields
$missing = @()
if ($d.aws.account_id -match "YOUR_") { $missing += "AWS Account ID" }
if ($d.telegram.bot_token -match "YOUR_") { $missing += "Telegram Bot Token" }
if ($d.telegram.bot_username -match "YOUR_") { $missing += "Telegram Bot Username" }
if ($d.email.alert_email -match "YOUR_") { $missing += "Alert Email" }

if ($missing.Count -gt 0) {
    Write-Err "Fill these fields in deploy-config.json:"
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
Write-Success "All required fields filled"


# Generate secrets
Write-Step "Generating secrets"

function New-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

if ($d.secrets.jwt_secret -eq "GENERATE_OR_LEAVE_AUTO") {
    $jwtSecret = New-Secret
    Write-Success "JWT Secret generated"
} else {
    $jwtSecret = $d.secrets.jwt_secret
    Write-Info "Using provided JWT Secret"
}

if ($d.telegram.webhook_secret -eq "GENERATE_OR_LEAVE_AUTO") {
    $webhookSecret = New-Secret
    Write-Success "Webhook Secret generated"
} else {
    $webhookSecret = $d.telegram.webhook_secret
    Write-Info "Using provided Webhook Secret"
}

# Save to AWS Secrets Manager
Write-Step "Saving secrets to AWS"

$prefix = "$($d.environment.project_name)/$($d.environment.name)"

try {
    aws secretsmanager describe-secret --secret-id "$prefix/jwt-secret" 2>$null | Out-Null
    aws secretsmanager update-secret --secret-id "$prefix/jwt-secret" --secret-string $jwtSecret 2>$null | Out-Null
    Write-Info "JWT Secret updated"
} catch {
    aws secretsmanager create-secret --name "$prefix/jwt-secret" --secret-string $jwtSecret 2>$null | Out-Null
    Write-Success "JWT Secret created"
}

try {
    aws secretsmanager describe-secret --secret-id "$prefix/telegram-bot-token" 2>$null | Out-Null
    aws secretsmanager update-secret --secret-id "$prefix/telegram-bot-token" --secret-string $d.telegram.bot_token 2>$null | Out-Null
    Write-Info "Telegram token updated"
} catch {
    aws secretsmanager create-secret --name "$prefix/telegram-bot-token" --secret-string $d.telegram.bot_token 2>$null | Out-Null
    Write-Success "Telegram token created"
}


# Create .env.production
Write-Step "Creating .env.production"

$envLines = @(
    "NODE_ENV=$($d.environment.name)",
    "AWS_REGION=$($d.aws.region)",
    "AWS_ACCOUNT_ID=$($d.aws.account_id)",
    "DYNAMODB_TABLE=$($d.environment.project_name)-$($d.environment.name)-table",
    "JWT_SECRET=$jwtSecret",
    "TELEGRAM_BOT_TOKEN=$($d.telegram.bot_token)",
    "TELEGRAM_BOT_USERNAME=$($d.telegram.bot_username)",
    "TELEGRAM_WEBHOOK_SECRET=$webhookSecret",
    "SES_FROM_EMAIL=$($d.email.from_email)",
    "FRONTEND_URL=$($d.environment.frontend_url)"
)
$envLines | Set-Content -Path "lambda\.env.production" -Encoding UTF8
Write-Success ".env.production created"

# Create terraform.tfvars
Write-Step "Creating terraform.tfvars"

$tfLines = @(
    "environment    = `"$($d.environment.name)`"",
    "aws_region     = `"$($d.aws.region)`"",
    "aws_account_id = `"$($d.aws.account_id)`"",
    "project_name   = `"$($d.environment.project_name)`"",
    "dynamodb_table_name = `"$($d.environment.project_name)-$($d.environment.name)-table`"",
    "s3_bucket_prefix    = `"$($d.environment.project_name)-$($d.environment.name)`"",
    "lambda_memory_size = 512",
    "lambda_timeout     = 30",
    "alert_email        = `"$($d.email.alert_email)`"",
    "log_retention_days = 30"
)
$tfLines | Set-Content -Path "lambda\terraform\terraform.tfvars" -Encoding UTF8
Write-Success "terraform.tfvars created"

# Install dependencies
Write-Step "Installing dependencies"

Push-Location lambda
if (-not (Test-Path "node_modules")) {
    Write-Info "Running npm install..."
    npm install
    Write-Success "Dependencies installed"
} else {
    Write-Info "Dependencies already installed"
}
Pop-Location


# Build TypeScript
Write-Step "Building TypeScript"

Push-Location lambda
Write-Info "Compiling..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Err "TypeScript build failed"
    Pop-Location
    exit 1
}
Write-Success "TypeScript compiled"
Pop-Location

# Package Lambda functions
Write-Step "Packaging Lambda functions"

Push-Location lambda
Write-Info "Creating ZIP archives..."
node scripts/simple-package.js
if ($LASTEXITCODE -ne 0) {
    Write-Err "Lambda packaging failed"
    Pop-Location
    exit 1
}
$zips = (Get-ChildItem -Path "build" -Filter "*.zip" -ErrorAction SilentlyContinue).Count
Write-Success "$zips ZIP archives created"
Pop-Location

# Terraform
Write-Step "Terraform Init"

Push-Location lambda\terraform
terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Err "Terraform init failed"
    Pop-Location
    exit 1
}
Write-Success "Terraform initialized"

Write-Step "Terraform Validate"
terraform validate
if ($LASTEXITCODE -ne 0) {
    Write-Err "Terraform validation failed"
    Pop-Location
    exit 1
}
Write-Success "Terraform config valid"


# Terraform Plan
if (-not $DryRun) {
    Write-Step "Terraform Plan"
    terraform plan -out=tfplan
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Terraform plan failed"
        Pop-Location
        exit 1
    }
    Write-Success "Plan created"
    
    if (-not $AutoApprove -and -not $d.options.auto_approve) {
        Write-Warn "Review the plan above!"
        $continue = Read-Host "Continue deploy? (y/n)"
        if ($continue -ne "y") {
            Write-Err "Deploy cancelled"
            Pop-Location
            exit 1
        }
    }
}

# Terraform Apply
if (-not $DryRun) {
    Write-Step "Terraform Apply"
    Write-Warn "This will take 10-15 minutes..."
    
    if ($AutoApprove -or $d.options.auto_approve) {
        terraform apply -auto-approve
    } else {
        terraform apply tfplan
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Terraform apply failed"
        Pop-Location
        exit 1
    }
    Write-Success "Deploy completed!"
    
    $apiUrl = terraform output -raw api_gateway_url 2>$null
    Pop-Location
} else {
    Write-Info "Dry run - no deploy"
    Pop-Location
    exit 0
}


# Configure Telegram Webhook
if ($d.options.configure_telegram_webhook -and $apiUrl) {
    Write-Step "Configuring Telegram Webhook"
    
    $webhookUrl = "$apiUrl/auth/telegram/webhook"
    Write-Info "Setting webhook: $webhookUrl"
    
    $body = @{ url = $webhookUrl; secret_token = $webhookSecret } | ConvertTo-Json
    
    try {
        $resp = Invoke-RestMethod -Uri "https://api.telegram.org/bot$($d.telegram.bot_token)/setWebhook" -Method Post -ContentType "application/json" -Body $body
        if ($resp.ok) {
            Write-Success "Telegram webhook configured"
        } else {
            Write-Warn "Webhook error: $($resp.description)"
        }
    } catch {
        Write-Warn "Could not set webhook: $_"
    }
}

# Verify deployment
Write-Step "Verifying deployment"

if ($apiUrl) {
    Write-Info "API URL: $apiUrl"
    
    try {
        $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -ErrorAction Stop
        if ($health.status -eq "healthy") {
            Write-Success "Health check passed"
        }
    } catch {
        Write-Warn "Health endpoint not ready (cold start)"
    }
}

# Count resources
$lambdaCount = "N/A"
$tableStatus = "UNKNOWN"

try {
    $funcs = aws lambda list-functions --query "Functions[?starts_with(FunctionName, '$($d.environment.project_name)-$($d.environment.name)')].FunctionName" --output json 2>$null | ConvertFrom-Json
    $lambdaCount = $funcs.Count
    Write-Success "$lambdaCount Lambda functions deployed"
} catch {
    Write-Warn "Could not count Lambda functions"
}

try {
    $tableStatus = aws dynamodb describe-table --table-name "$($d.environment.project_name)-$($d.environment.name)-table" --query "Table.TableStatus" --output text 2>$null
    Write-Success "DynamoDB table: $tableStatus"
} catch {
    Write-Warn "Could not check DynamoDB"
}


# Final summary
$duration = (Get-Date) - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "        DEPLOY COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "API Gateway: $apiUrl" -ForegroundColor Cyan
Write-Host "Telegram Bot: @$($d.telegram.bot_username)" -ForegroundColor Cyan
Write-Host "Lambda Functions: $lambdaCount" -ForegroundColor Cyan
Write-Host "DynamoDB: $tableStatus" -ForegroundColor Cyan
Write-Host ""
Write-Host "Duration: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "1. Test Telegram bot" -ForegroundColor White
Write-Host "2. Update mobile app with API URL" -ForegroundColor White
Write-Host "3. Check CloudWatch logs" -ForegroundColor White
Write-Host ""
