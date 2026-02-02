# 🚀 Deployment Guide - AWS Lambda

Пошаговая инструкция по деплою HandShakeMe на AWS Lambda.

---

## 📋 Pre-Deployment Checklist

### 1. AWS Account Setup
- [ ] AWS Account создан
- [ ] AWS CLI установлен и настроен
- [ ] Terraform установлен (v1.6+)
- [ ] Node.js 18+ установлен
- [ ] Git установлен

### 2. AWS Credentials
```bash
# Проверить AWS credentials
aws sts get-caller-identity

# Если не настроено:
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### 3. Required AWS Services
- [ ] DynamoDB
- [ ] Lambda
- [ ] API Gateway
- [ ] S3
- [ ] CloudWatch
- [ ] IAM
- [ ] Secrets Manager (для JWT_SECRET)

---

## 🔧 Step 1: Configure Environment Variables

### 1.1 Create Production .env File

```bash
cd lambda
cp .env.production.example .env.production
```

### 1.2 Edit .env.production

**КРИТИЧЕСКИ ВАЖНО - Заполните эти значения:**

```bash
# JWT - ОБЯЗАТЕЛЬНО СГЕНЕРИРОВАТЬ!
JWT_SECRET="GENERATE_STRONG_SECRET_HERE_MIN_32_CHARS"

# AWS
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"

# Telegram Bot
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_BOTFATHER"
TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_WEBHOOK_SECRET="GENERATE_WEBHOOK_SECRET"

# Database (будет создано Terraform)
DYNAMODB_TABLE="handshakeme-production-table"

# S3 Buckets (будут созданы Terraform)
S3_BUCKET_AVATARS="handshakeme-prod-avatars"
S3_BUCKET_PORTFOLIO="handshakeme-prod-portfolio"
S3_BUCKET_ORDERS="handshakeme-prod-orders"

# Email
SES_FROM_EMAIL="noreply@yourdomain.com"

# Frontend URL
FRONTEND_URL="https://yourdomain.com"
CORS_ORIGIN="https://yourdomain.com"

# Monitoring (опционально)
SENTRY_DSN="your-sentry-dsn"
```

### 1.3 Generate Strong Secrets

```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate TELEGRAM_WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 Step 2: Configure Terraform Variables

### 2.1 Create terraform.tfvars

```bash
cd lambda/terraform
cp terraform.tfvars.example terraform.tfvars
```

### 2.2 Edit terraform.tfvars

```hcl
# Basic Configuration
environment    = "production"
aws_region     = "us-east-1"
aws_account_id = "YOUR_AWS_ACCOUNT_ID"
project_name   = "handshakeme"

# Domain Configuration (если есть домен)
domain_name = "yourdomain.com"
api_domain  = "api.yourdomain.com"

# DynamoDB
dynamodb_table_name = "handshakeme-production-table"

# S3
s3_bucket_prefix = "handshakeme-prod"

# Lambda
lambda_memory_size = 512
lambda_timeout     = 30

# Monitoring
alert_email = "your-email@example.com"
log_retention_days = 30

# Tags
tags = {
  Environment = "production"
  Project     = "HandShakeMe"
  ManagedBy   = "Terraform"
}
```

---

## 🔧 Step 3: Store Secrets in AWS Secrets Manager

### 3.1 Create JWT Secret

```bash
aws secretsmanager create-secret \
  --name handshakeme/production/jwt-secret \
  --description "JWT Secret for HandShakeMe" \
  --secret-string "YOUR_GENERATED_JWT_SECRET"
```

### 3.2 Create Telegram Bot Token

```bash
aws secretsmanager create-secret \
  --name handshakeme/production/telegram-bot-token \
  --description "Telegram Bot Token" \
  --secret-string "YOUR_TELEGRAM_BOT_TOKEN"
```

### 3.3 Verify Secrets

```bash
aws secretsmanager list-secrets
```

---

## 📦 Step 4: Build and Package Lambda Functions

### 4.1 Install Dependencies

```bash
cd lambda
npm install
```

### 4.2 Run Tests (опционально, но рекомендуется)

```bash
# Run all tests
npm test

# Run security tests
npm run test:security

# Run critical tests
npm run test:critical

# Pre-deploy check
npm run deploy:check
```

### 4.3 Build TypeScript

```bash
npm run build
```

### 4.4 Package Lambda Functions

**Windows (PowerShell):**
```powershell
node scripts/package-lambdas.js
```

**Linux/Mac:**
```bash
node scripts/package-lambdas.js
```

Это создаст ZIP файлы в `lambda/build/`:
- `auth-functions.zip`
- `orders-functions.zip`
- `profiles-functions.zip`
- И т.д.

---

## 🏗️ Step 5: Deploy Infrastructure with Terraform

### 5.1 Initialize Terraform

```bash
cd lambda/terraform
terraform init
```

### 5.2 Validate Configuration

```bash
terraform validate
```

### 5.3 Plan Deployment

```bash
terraform plan -out=tfplan
```

**Проверьте план:**
- Сколько ресурсов будет создано
- Нет ли ошибок в конфигурации
- Правильные ли имена ресурсов

### 5.4 Apply Deployment

```bash
terraform apply tfplan
```

**Это создаст:**
- DynamoDB таблицу
- Lambda функции (~150 функций)
- API Gateway
- S3 buckets
- IAM roles и policies
- CloudWatch log groups

**Время деплоя:** 10-15 минут

### 5.5 Save Outputs

```bash
terraform output > ../deployment-outputs.txt
```

---

## 🔍 Step 6: Verify Deployment

### 6.1 Check Lambda Functions

```bash
# List all Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `handshakeme-production`)].FunctionName'

# Check specific function
aws lambda get-function --function-name handshakeme-production-auth-telegram-login
```

### 6.2 Check API Gateway

```bash
# Get API Gateway URL
terraform output api_gateway_url

# Test health endpoint
curl https://YOUR_API_GATEWAY_URL/health
```

### 6.3 Check DynamoDB Table

```bash
# Describe table
aws dynamodb describe-table --table-name handshakeme-production-table

# Check if table is active
aws dynamodb describe-table --table-name handshakeme-production-table \
  --query 'Table.TableStatus'
```

### 6.4 Check CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/handshakeme

# Tail logs for specific function
aws logs tail /aws/lambda/handshakeme-production-auth-telegram-login --follow
```

---

## 🧪 Step 7: Test Endpoints

### 7.1 Get API Gateway URL

```bash
cd lambda/terraform
terraform output api_gateway_url
```

### 7.2 Test Health Endpoint

```bash
curl https://YOUR_API_URL/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T...",
  "version": "1.0.0"
}
```

### 7.3 Test Telegram Auth

```bash
# Get Telegram auth code
curl -X POST https://YOUR_API_URL/auth/telegram/code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+996XXXXXXXXX"}'
```

### 7.4 Test Categories

```bash
curl https://YOUR_API_URL/categories
```

---

## 🔐 Step 8: Configure Telegram Bot Webhook

### 8.1 Set Webhook URL

```bash
# Get your API Gateway URL
API_URL=$(cd lambda/terraform && terraform output -raw api_gateway_url)

# Set webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${API_URL}/auth/telegram/webhook\",
    \"secret_token\": \"YOUR_WEBHOOK_SECRET\"
  }"
```

### 8.2 Verify Webhook

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

---

## 📱 Step 9: Configure Mobile App

### 9.1 Update Mobile .env

```bash
cd mobile
```

Edit `mobile/.env`:
```bash
# API Configuration
API_URL=https://YOUR_API_GATEWAY_URL
WS_URL=wss://YOUR_WEBSOCKET_URL

# Telegram Bot
TELEGRAM_BOT_USERNAME=your_bot_username

# Environment
NODE_ENV=production
```

### 9.2 Rebuild Mobile App

```bash
# For Android
npm run android:build

# For iOS
npm run ios:build
```

---

## 📊 Step 10: Setup Monitoring

### 10.1 Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name handshakeme-production \
  --dashboard-body file://cloudwatch-dashboard.json
```

### 10.2 Create Alarms

```bash
# Lambda errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name handshakeme-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

### 10.3 Setup X-Ray (опционально)

```bash
# Enable X-Ray tracing for Lambda functions
aws lambda update-function-configuration \
  --function-name handshakeme-production-auth-telegram-login \
  --tracing-config Mode=Active
```

---

## 🔄 Step 11: Setup CI/CD (опционально)

### 11.1 GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS Lambda

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd lambda && npm ci
      
      - name: Run tests
        run: cd lambda && npm run test:pre-deploy
      
      - name: Build
        run: cd lambda && npm run build
      
      - name: Package Lambdas
        run: cd lambda && node scripts/package-lambdas.js
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy with Terraform
        run: |
          cd lambda/terraform
          terraform init
          terraform apply -auto-approve
```

---

## 🐛 Troubleshooting

### Issue: Terraform fails with "AccessDenied"

**Solution:**
```bash
# Check IAM permissions
aws iam get-user

# Ensure your user has these policies:
# - AmazonDynamoDBFullAccess
# - AWSLambda_FullAccess
# - AmazonAPIGatewayAdministrator
# - AmazonS3FullAccess
# - IAMFullAccess
```

### Issue: Lambda function timeout

**Solution:**
```bash
# Increase timeout in terraform/variables.tf
lambda_timeout = 60  # Increase from 30 to 60 seconds

# Apply changes
terraform apply
```

### Issue: DynamoDB throttling

**Solution:**
```bash
# Switch to provisioned capacity or increase on-demand limits
# Contact AWS support for limit increase
```

### Issue: API Gateway 502 errors

**Solution:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/YOUR_FUNCTION_NAME --follow

# Check Lambda permissions
aws lambda get-policy --function-name YOUR_FUNCTION_NAME
```

---

## 📝 Post-Deployment Checklist

- [ ] All Lambda functions deployed successfully
- [ ] API Gateway endpoints responding
- [ ] DynamoDB table created and accessible
- [ ] S3 buckets created
- [ ] Telegram webhook configured
- [ ] Mobile app updated with API URL
- [ ] CloudWatch alarms configured
- [ ] Monitoring dashboard created
- [ ] Backup strategy configured
- [ ] Documentation updated
- [ ] Team notified

---

## 🔄 Updates and Rollbacks

### Update Lambda Function

```bash
# Update single function
cd lambda
npm run build
node scripts/package-lambdas.js

cd terraform
terraform apply -target=aws_lambda_function.auth_telegram_login
```

### Rollback Deployment

```bash
cd lambda/terraform

# Rollback to previous state
terraform apply -target=aws_lambda_function.YOUR_FUNCTION \
  -var="lambda_version=previous"

# Or destroy and recreate
terraform destroy -target=aws_lambda_function.YOUR_FUNCTION
terraform apply -target=aws_lambda_function.YOUR_FUNCTION
```

---

## 💰 Cost Estimation

**Monthly costs (estimated):**

- **Lambda:** $20-50 (1M requests)
- **DynamoDB:** $25-100 (on-demand)
- **API Gateway:** $3.50 (1M requests)
- **S3:** $5-20 (storage + transfer)
- **CloudWatch:** $5-10 (logs)
- **Data Transfer:** $10-30

**Total:** ~$70-210/month for moderate traffic

---

## 📞 Support

**Issues:**
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@yourdomain.com

**Documentation:**
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- Terraform: https://www.terraform.io/docs
- API Docs: https://api.yourdomain.com/docs

---

## ✅ Success!

Если все шаги выполнены успешно, ваше приложение теперь работает на AWS Lambda! 🎉

**Next Steps:**
1. Настроить мониторинг
2. Настроить автоматические бэкапы
3. Настроить CI/CD
4. Провести load testing
5. Настроить CDN для статики

---

**Deployment Date:** _________  
**Deployed By:** _________  
**Version:** 1.0.0  
**Environment:** Production
