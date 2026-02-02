# 🚀 HandShakeMe - AWS Lambda Deployment

Полная документация по деплою на AWS Lambda.

---

## 📚 Документация

### Для Быстрого Старта
1. **DEPLOYMENT_CHECKLIST.md** ⭐ - Пошаговый чеклист (начни здесь!)
2. **DEPLOYMENT_COMMANDS.md** - Все команды для копирования
3. **DEPLOYMENT_GUIDE.md** - Детальная инструкция

### Выбери свой путь:

#### 🏃 Быстрый деплой (1-1.5 часа)
→ Используй **DEPLOYMENT_CHECKLIST.md**

#### 📖 Детальная инструкция
→ Используй **DEPLOYMENT_GUIDE.md**

#### ⚡ Только команды
→ Используй **DEPLOYMENT_COMMANDS.md**

---

## ⚡ Quick Start (TL;DR)

### Prerequisites
```bash
# Check installations
aws --version          # AWS CLI
terraform --version    # Terraform 1.6+
node --version         # Node.js 18+
```

### 1. Generate Secrets
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Get AWS Account ID
aws sts get-caller-identity --query Account --output text
```

### 2. Configure
```bash
# Lambda environment
cd lambda
cp .env.production.example .env.production
# Edit .env.production with your values

# Terraform variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Store Secrets
```bash
aws secretsmanager create-secret \
  --name handshakeme/production/jwt-secret \
  --secret-string "YOUR_JWT_SECRET"

aws secretsmanager create-secret \
  --name handshakeme/production/telegram-bot-token \
  --secret-string "YOUR_BOT_TOKEN"
```

### 4. Build & Deploy
```bash
cd lambda
npm install
npm run build
node scripts/package-lambdas.js

cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 5. Configure Telegram Bot
```bash
API_URL=$(terraform output -raw api_gateway_url)
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${API_URL}/auth/telegram/webhook\", \"secret_token\": \"${WEBHOOK_SECRET}\"}"
```

### 6. Test
```bash
curl https://YOUR_API_URL/health
```

**Done!** 🎉

---

## 📋 What Gets Deployed

### AWS Resources Created:
- **~150 Lambda Functions** (all your endpoints)
- **1 DynamoDB Table** (single-table design)
- **1 API Gateway** (REST API)
- **6 S3 Buckets** (avatars, portfolio, orders, etc.)
- **IAM Roles & Policies** (Lambda execution)
- **CloudWatch Log Groups** (monitoring)
- **Secrets Manager** (JWT, Telegram token)

### Estimated Costs:
- **Development:** ~$10-30/month
- **Production (low traffic):** ~$50-100/month
- **Production (medium traffic):** ~$100-300/month

---

## 🔐 Required Secrets

### Must Have:
1. **JWT_SECRET** - 32+ characters, random
2. **TELEGRAM_BOT_TOKEN** - from @BotFather
3. **TELEGRAM_WEBHOOK_SECRET** - 32+ characters, random
4. **AWS_ACCOUNT_ID** - your AWS account

### Optional:
- **SENTRY_DSN** - for error monitoring
- **STRIPE_SECRET_KEY** - for payments
- **SES_FROM_EMAIL** - for emails

---

## 🎯 Deployment Environments

### Development
```bash
environment = "development"
lambda_memory_size = 256
lambda_timeout = 30
```

### Staging
```bash
environment = "staging"
lambda_memory_size = 512
lambda_timeout = 30
```

### Production
```bash
environment = "production"
lambda_memory_size = 512
lambda_timeout = 30
enable_waf = true
enable_detailed_monitoring = true
```

---

## 🔍 Verification Steps

### 1. Check Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `handshakeme`)].FunctionName' --output table
```
**Expected:** ~150 functions

### 2. Test Health Endpoint
```bash
curl https://YOUR_API_URL/health
```
**Expected:** `{"status":"healthy"}`

### 3. Check DynamoDB
```bash
aws dynamodb describe-table --table-name handshakeme-production-table --query 'Table.TableStatus'
```
**Expected:** `"ACTIVE"`

### 4. Test Telegram Bot
1. Open Telegram
2. Search for your bot
3. Send `/start`
**Expected:** Bot responds

---

## 🐛 Common Issues

### Issue: "AccessDenied" during Terraform apply
**Solution:** Check IAM permissions
```bash
aws iam get-user
# Ensure you have admin access or required policies
```

### Issue: Lambda timeout
**Solution:** Increase timeout in `variables.tf`
```hcl
lambda_timeout = 60  # Increase from 30
```

### Issue: DynamoDB throttling
**Solution:** Check CloudWatch metrics
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=handshakeme-production-table \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Issue: Telegram webhook not working
**Solution:** Check webhook info
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

---

## 🔄 Updates & Rollbacks

### Update Single Function
```bash
cd lambda
npm run build
node scripts/package-lambdas.js

cd terraform
terraform apply -target=aws_lambda_function.FUNCTION_NAME
```

### Update All Functions
```bash
cd lambda/terraform
terraform apply
```

### Rollback
```bash
cd lambda/terraform
terraform destroy -target=aws_lambda_function.FUNCTION_NAME
terraform apply -target=aws_lambda_function.FUNCTION_NAME
```

---

## 📊 Monitoring

### CloudWatch Logs
```bash
# Tail logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/FUNCTION_NAME \
  --filter-pattern "ERROR"
```

### Metrics
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=FUNCTION_NAME \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Alarms
```bash
# Create error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name handshakeme-errors \
  --alarm-description "Alert on errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 🔐 Security Best Practices

### ✅ Do:
- Store secrets in AWS Secrets Manager
- Use strong JWT secrets (32+ chars)
- Enable CloudWatch logging
- Use IAM roles (not access keys)
- Enable DynamoDB encryption
- Enable S3 encryption
- Use HTTPS only
- Configure CORS properly

### ❌ Don't:
- Hardcode secrets in code
- Commit .env files
- Use weak passwords
- Disable encryption
- Allow public S3 access
- Skip monitoring
- Ignore security updates

---

## 💰 Cost Optimization

### Tips:
1. **Use on-demand pricing** for DynamoDB (pay per request)
2. **Set Lambda memory** appropriately (512MB is good start)
3. **Enable S3 lifecycle policies** (delete old files)
4. **Use CloudWatch Logs retention** (30 days is enough)
5. **Monitor unused resources** (delete if not needed)

### Cost Breakdown:
```
Lambda:        $0.20 per 1M requests + $0.0000166667 per GB-second
DynamoDB:      $1.25 per million write requests, $0.25 per million read requests
API Gateway:   $3.50 per million requests
S3:            $0.023 per GB storage + $0.09 per GB transfer
CloudWatch:    $0.50 per GB ingested
```

---

## 📞 Support & Resources

### Documentation
- **AWS Lambda:** https://docs.aws.amazon.com/lambda/
- **Terraform:** https://www.terraform.io/docs
- **DynamoDB:** https://docs.aws.amazon.com/dynamodb/

### Community
- **GitHub Issues:** https://github.com/your-repo/issues
- **Telegram:** @your_support_bot
- **Email:** support@yourdomain.com

### Useful Links
- **AWS Console:** https://console.aws.amazon.com/
- **Terraform Cloud:** https://app.terraform.io/
- **CloudWatch:** https://console.aws.amazon.com/cloudwatch/

---

## ✅ Post-Deployment Checklist

- [ ] All Lambda functions deployed
- [ ] API Gateway responding
- [ ] DynamoDB table active
- [ ] S3 buckets created
- [ ] Telegram webhook configured
- [ ] Mobile app updated
- [ ] Monitoring configured
- [ ] Alarms set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Load testing done

---

## 🎉 Success!

Если все шаги выполнены, твое приложение работает на AWS Lambda!

**Next Steps:**
1. Monitor logs for 24 hours
2. Run load tests
3. Configure automated backups
4. Setup CI/CD pipeline
5. Announce to users

---

## 📝 Notes

### Deployment Date: _________
### Deployed By: _________
### Environment: Production
### Version: 1.0.0
### API URL: _________

---

**Questions?** Check DEPLOYMENT_GUIDE.md for detailed instructions!
