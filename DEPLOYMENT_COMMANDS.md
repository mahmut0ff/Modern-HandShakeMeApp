# 🚀 Deployment Commands - Quick Reference

Все команды для быстрого копирования.

---

## 🔐 Generate Secrets

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Get AWS Account ID
aws sts get-caller-identity --query Account --output text
```

---

## 📝 Setup Configuration

```bash
# Copy environment files
cd lambda
cp .env.production.example .env.production
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

---

## 🔒 Store Secrets in AWS

```bash
# JWT Secret
aws secretsmanager create-secret \
  --name handshakeme/production/jwt-secret \
  --secret-string "YOUR_JWT_SECRET"

# Telegram Bot Token
aws secretsmanager create-secret \
  --name handshakeme/production/telegram-bot-token \
  --secret-string "YOUR_BOT_TOKEN"

# Verify
aws secretsmanager list-secrets
```

---

## 📦 Build & Package

```bash
cd lambda

# Install
npm install

# Test (optional)
npm run test:pre-deploy

# Build
npm run build

# Package
node scripts/package-lambdas.js

# Verify
ls build/*.zip
```

---

## 🏗️ Terraform Deployment

```bash
cd lambda/terraform

# Initialize
terraform init

# Validate
terraform validate

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Save outputs
terraform output > ../deployment-outputs.txt
terraform output api_gateway_url
```

---

## 🔍 Verification Commands

```bash
# Test health endpoint
curl https://YOUR_API_URL/health

# List Lambda functions
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `handshakeme-production`)].FunctionName' \
  --output table

# Check DynamoDB
aws dynamodb describe-table \
  --table-name handshakeme-production-table \
  --query 'Table.TableStatus'

# Tail logs
aws logs tail /aws/lambda/handshakeme-production-auth-telegram-login --follow
```

---

## 🤖 Telegram Bot Setup

```bash
# Set variables
API_URL="https://YOUR_API_URL"
BOT_TOKEN="YOUR_BOT_TOKEN"
WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

# Set webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${API_URL}/auth/telegram/webhook\", \"secret_token\": \"${WEBHOOK_SECRET}\"}"

# Verify webhook
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

# Delete webhook (if needed)
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook"
```

---

## 📊 Monitoring Setup

```bash
# Create SNS topic
aws sns create-topic --name handshakeme-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:handshakeme-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name handshakeme-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 🔄 Update Deployment

```bash
cd lambda

# Rebuild
npm run build
node scripts/package-lambdas.js

# Update specific function
cd terraform
terraform apply -target=aws_lambda_function.auth_telegram_login

# Update all
terraform apply
```

---

## 🐛 Troubleshooting Commands

```bash
# Check Lambda function
aws lambda get-function --function-name FUNCTION_NAME

# Invoke Lambda directly
aws lambda invoke \
  --function-name FUNCTION_NAME \
  --payload '{}' \
  output.json && cat output.json

# Check Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Check API Gateway
aws apigateway get-rest-apis

# Check DynamoDB table
aws dynamodb scan \
  --table-name handshakeme-production-table \
  --limit 10

# Check IAM role
aws iam get-role --role-name handshakeme-production-lambda-role

# Check S3 buckets
aws s3 ls | grep handshakeme
```

---

## 🗑️ Cleanup/Rollback

```bash
cd lambda/terraform

# Destroy specific resource
terraform destroy -target=aws_lambda_function.FUNCTION_NAME

# Destroy everything (CAREFUL!)
terraform destroy

# Rollback to previous state
terraform apply -target=RESOURCE_NAME
```

---

## 📱 Mobile App Commands

```bash
cd mobile

# Update .env
echo "API_URL=https://YOUR_API_URL" > .env
echo "TELEGRAM_BOT_USERNAME=your_bot" >> .env

# Run Android
npm run android

# Run iOS
npm run ios

# Build Android
npm run android:build

# Build iOS
npm run ios:build
```

---

## 🔍 Useful Queries

```bash
# Get all Lambda function names
aws lambda list-functions \
  --query 'Functions[].FunctionName' \
  --output text

# Get API Gateway URL
cd lambda/terraform
terraform output -raw api_gateway_url

# Get DynamoDB table ARN
aws dynamodb describe-table \
  --table-name handshakeme-production-table \
  --query 'Table.TableArn' \
  --output text

# Count items in DynamoDB
aws dynamodb scan \
  --table-name handshakeme-production-table \
  --select COUNT

# Get CloudWatch log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/handshakeme

# Get recent Lambda errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/FUNCTION_NAME \
  --filter-pattern "ERROR"
```

---

## 💰 Cost Monitoring

```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Get Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=FUNCTION_NAME \
  --start-time 2026-02-01T00:00:00Z \
  --end-time 2026-02-28T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

---

## 🔐 Security Commands

```bash
# List secrets
aws secretsmanager list-secrets

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id handshakeme/production/jwt-secret \
  --query SecretString \
  --output text

# Rotate secret
aws secretsmanager rotate-secret \
  --secret-id handshakeme/production/jwt-secret

# Check IAM policies
aws iam list-attached-role-policies \
  --role-name handshakeme-production-lambda-role

# Check S3 bucket policies
aws s3api get-bucket-policy \
  --bucket handshakeme-prod-avatars
```

---

## 📊 Performance Monitoring

```bash
# Lambda duration
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=FUNCTION_NAME \
  --start-time 2026-02-02T00:00:00Z \
  --end-time 2026-02-02T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# DynamoDB consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=handshakeme-production-table \
  --start-time 2026-02-02T00:00:00Z \
  --end-time 2026-02-02T23:59:59Z \
  --period 3600 \
  --statistics Sum

# API Gateway requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=handshakeme-production \
  --start-time 2026-02-02T00:00:00Z \
  --end-time 2026-02-02T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## 🔄 Backup & Restore

```bash
# Create DynamoDB backup
aws dynamodb create-backup \
  --table-name handshakeme-production-table \
  --backup-name handshakeme-backup-$(date +%Y%m%d)

# List backups
aws dynamodb list-backups \
  --table-name handshakeme-production-table

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name handshakeme-production-table-restored \
  --backup-arn BACKUP_ARN

# Export to S3
aws dynamodb export-table-to-point-in-time \
  --table-arn TABLE_ARN \
  --s3-bucket handshakeme-backups \
  --export-format DYNAMODB_JSON
```

---

## 🎯 One-Line Deployment

```bash
# Full deployment in one command (after configuration)
cd lambda && \
npm install && \
npm run build && \
node scripts/package-lambdas.js && \
cd terraform && \
terraform init && \
terraform apply -auto-approve
```

---

## 📝 Quick Status Check

```bash
# Check everything
echo "=== Lambda Functions ===" && \
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `handshakeme`)].FunctionName' --output text | wc -l && \
echo "=== DynamoDB ===" && \
aws dynamodb describe-table --table-name handshakeme-production-table --query 'Table.TableStatus' --output text && \
echo "=== API Gateway ===" && \
cd lambda/terraform && terraform output api_gateway_url && \
echo "=== Secrets ===" && \
aws secretsmanager list-secrets --query 'SecretList[?starts_with(Name, `handshakeme`)].Name' --output text
```

---

**Tip:** Сохрани этот файл и используй для быстрого копирования команд! 🚀
