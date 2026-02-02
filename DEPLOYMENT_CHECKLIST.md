# ✅ Deployment Checklist - Quick Reference

Используй этот чеклист для быстрого деплоя.

---

## 🚀 Pre-Deployment (15 минут)

### AWS Setup
- [ ] AWS Account создан
- [ ] AWS CLI установлен: `aws --version`
- [ ] AWS credentials настроены: `aws sts get-caller-identity`
- [ ] Terraform установлен: `terraform --version` (v1.6+)
- [ ] Node.js установлен: `node --version` (v18+)

### Get AWS Account ID
```bash
aws sts get-caller-identity --query Account --output text
```
**Account ID:** ___________________

---

## 🔐 Secrets Generation (5 минут)

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**JWT_SECRET:** ___________________

### Generate Webhook Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**WEBHOOK_SECRET:** ___________________

### Get Telegram Bot Token
1. Open Telegram
2. Search for @BotFather
3. Send `/newbot`
4. Follow instructions

**BOT_TOKEN:** ___________________  
**BOT_USERNAME:** ___________________

---

## 📝 Configuration Files (10 минут)

### 1. Create lambda/.env.production
```bash
cd lambda
cp .env.production.example .env.production
```

**Edit and fill:**
- [ ] JWT_SECRET
- [ ] AWS_ACCOUNT_ID
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_BOT_USERNAME
- [ ] TELEGRAM_WEBHOOK_SECRET
- [ ] SES_FROM_EMAIL (your email)
- [ ] FRONTEND_URL (your domain or temp URL)

### 2. Create lambda/terraform/terraform.tfvars
```bash
cd lambda/terraform
cp terraform.tfvars.example terraform.tfvars
```

**Edit and fill:**
- [ ] aws_account_id
- [ ] alert_email (your email)
- [ ] domain_name (if you have one)

---

## 🔒 AWS Secrets Manager (5 минут)

### Store JWT Secret
```bash
aws secretsmanager create-secret \
  --name handshakeme/production/jwt-secret \
  --secret-string "YOUR_JWT_SECRET_HERE"
```
- [ ] JWT secret stored

### Store Telegram Token
```bash
aws secretsmanager create-secret \
  --name handshakeme/production/telegram-bot-token \
  --secret-string "YOUR_TELEGRAM_BOT_TOKEN_HERE"
```
- [ ] Telegram token stored

### Verify
```bash
aws secretsmanager list-secrets
```
- [ ] Both secrets visible

---

## 📦 Build & Package (10 минут)

### Install Dependencies
```bash
cd lambda
npm install
```
- [ ] Dependencies installed

### Run Tests (optional but recommended)
```bash
npm run test:pre-deploy
```
- [ ] Tests passed (or skipped)

### Build TypeScript
```bash
npm run build
```
- [ ] Build successful
- [ ] `build/` folder created

### Package Lambda Functions
```bash
node scripts/package-lambdas.js
```
- [ ] ZIP files created in `build/`
- [ ] Check: `ls build/*.zip`

---

## 🏗️ Terraform Deployment (15 минут)

### Initialize
```bash
cd lambda/terraform
terraform init
```
- [ ] Terraform initialized
- [ ] Providers downloaded

### Validate
```bash
terraform validate
```
- [ ] Configuration valid

### Plan
```bash
terraform plan -out=tfplan
```
- [ ] Plan created
- [ ] Review: ~150 resources to create
- [ ] No errors

### Apply
```bash
terraform apply tfplan
```
- [ ] Deployment started
- [ ] Wait 10-15 minutes
- [ ] Deployment completed successfully

### Save Outputs
```bash
terraform output > ../deployment-outputs.txt
cat ../deployment-outputs.txt
```
- [ ] API Gateway URL saved
- [ ] WebSocket URL saved

**API URL:** ___________________

---

## 🔍 Verification (5 минут)

### Test Health Endpoint
```bash
curl https://YOUR_API_URL/health
```
- [ ] Returns `{"status":"healthy"}`

### Check Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `handshakeme-production`)].FunctionName' --output table
```
- [ ] ~150 functions listed

### Check DynamoDB
```bash
aws dynamodb describe-table --table-name handshakeme-production-table --query 'Table.TableStatus'
```
- [ ] Returns "ACTIVE"

### Check Logs
```bash
aws logs tail /aws/lambda/handshakeme-production-auth-telegram-login --follow
```
- [ ] Logs visible (Ctrl+C to exit)

---

## 🤖 Telegram Bot Setup (5 минут)

### Set Webhook
```bash
# Replace with your values
API_URL="https://YOUR_API_URL"
BOT_TOKEN="YOUR_BOT_TOKEN"
WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${API_URL}/auth/telegram/webhook\",
    \"secret_token\": \"${WEBHOOK_SECRET}\"
  }"
```
- [ ] Webhook set successfully

### Verify Webhook
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```
- [ ] Webhook URL correct
- [ ] `pending_update_count` is 0

### Test Bot
1. Open Telegram
2. Search for your bot: @YOUR_BOT_USERNAME
3. Send `/start`
- [ ] Bot responds

---

## 📱 Mobile App Configuration (5 минут)

### Update mobile/.env
```bash
cd mobile
```

**Edit `.env`:**
```bash
API_URL=https://YOUR_API_GATEWAY_URL
TELEGRAM_BOT_USERNAME=your_bot_username
NODE_ENV=production
```
- [ ] API_URL updated
- [ ] BOT_USERNAME updated

### Test Mobile App
```bash
# Android
npm run android

# iOS
npm run ios
```
- [ ] App connects to API
- [ ] Telegram auth works

---

## 📊 Monitoring Setup (10 минут)

### Create SNS Topic for Alerts
```bash
aws sns create-topic --name handshakeme-alerts
aws sns subscribe --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:handshakeme-alerts \
  --protocol email --notification-endpoint your-email@example.com
```
- [ ] SNS topic created
- [ ] Email subscription confirmed

### Create CloudWatch Alarm
```bash
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
- [ ] Alarm created

---

## ✅ Final Checks

### Functionality
- [ ] Health endpoint works
- [ ] Telegram bot responds
- [ ] Can create user via Telegram
- [ ] Can list categories
- [ ] Mobile app connects

### Security
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Secrets stored in AWS Secrets Manager
- [ ] No secrets in code
- [ ] CORS configured correctly

### Monitoring
- [ ] CloudWatch logs working
- [ ] Alarms configured
- [ ] Email alerts working

### Documentation
- [ ] API URL documented
- [ ] Credentials saved securely
- [ ] Team notified

---

## 🎉 Deployment Complete!

**Deployment Info:**
- **Date:** _________
- **Environment:** Production
- **API URL:** _________
- **Deployed By:** _________

**Next Steps:**
1. [ ] Load testing
2. [ ] Setup automated backups
3. [ ] Configure CI/CD
4. [ ] Monitor for 24 hours
5. [ ] Announce to users

---

## 🆘 Quick Troubleshooting

### Lambda not working?
```bash
# Check logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Check function
aws lambda get-function --function-name FUNCTION_NAME
```

### API Gateway 502?
```bash
# Check Lambda permissions
aws lambda get-policy --function-name FUNCTION_NAME

# Test Lambda directly
aws lambda invoke --function-name FUNCTION_NAME output.json
```

### DynamoDB errors?
```bash
# Check table status
aws dynamodb describe-table --table-name handshakeme-production-table

# Check IAM permissions
aws iam get-role --role-name handshakeme-production-lambda-role
```

### Telegram webhook not working?
```bash
# Check webhook info
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

# Delete and reset webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook"
# Then set again
```

---

## 📞 Support

**Emergency:** Check CloudWatch Logs first!

**Documentation:** See `DEPLOYMENT_GUIDE.md` for detailed instructions

**Issues:** Create GitHub issue with logs

---

**Total Time:** ~1-1.5 hours for first deployment
