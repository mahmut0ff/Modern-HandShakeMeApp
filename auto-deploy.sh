#!/bin/bash

# ============================================================================
# HandShakeMe - Автоматический Деплой на AWS Lambda
# ============================================================================
# Использование: ./auto-deploy.sh [options]
# Требования: AWS CLI, Terraform, Node.js 18+, jq
# ============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Функции для вывода
success() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${BLUE}ℹ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }
step() { echo -e "\n${MAGENTA}=== $1 ===${NC}"; }

# Параметры
SKIP_TESTS=false
AUTO_APPROVE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests) SKIP_TESTS=true; shift ;;
    --auto-approve) AUTO_APPROVE=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

START_TIME=$(date +%s)

# ============================================================================
# Проверка зависимостей
# ============================================================================

step "Проверка зависимостей"

# AWS CLI
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    success "AWS CLI установлен: $AWS_VERSION"
else
    error "AWS CLI не установлен. Установи: https://aws.amazon.com/cli/"
fi

# Terraform
if command -v terraform &> /dev/null; then
    TF_VERSION=$(terraform version -json | jq -r '.terraform_version')
    success "Terraform установлен: $TF_VERSION"
else
    error "Terraform не установлен. Установи: https://www.terraform.io/downloads"
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js установлен: $NODE_VERSION"
else
    error "Node.js не установлен. Установи: https://nodejs.org/"
fi

# jq
if ! command -v jq &> /dev/null; then
    warning "jq не установлен. Установи для лучшей работы: sudo apt install jq"
fi

# AWS credentials
if aws sts get-caller-identity &> /dev/null; then
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    success "AWS credentials настроены"
    info "  Account: $AWS_ACCOUNT"
    info "  User: $AWS_USER"
else
    error "AWS credentials не настроены. Запусти: aws configure"
fi

# ============================================================================
# Загрузка конфигурации
# ============================================================================

step "Загрузка конфигурации"

if [ ! -f "deploy-config.json" ]; then
    error "Файл deploy-config.json не найден!"
fi

# Проверка обязательных полей
check_field() {
    local field=$1
    local value=$(jq -r "$field" deploy-config.json)
    if [[ "$value" =~ YOUR_|ENTER_|FILL_ ]]; then
        echo "$field"
    fi
}

MISSING_FIELDS=()
MISSING_FIELDS+=($(check_field '.deployment.aws.account_id'))
MISSING_FIELDS+=($(check_field '.deployment.telegram.bot_token'))
MISSING_FIELDS+=($(check_field '.deployment.telegram.bot_username'))
MISSING_FIELDS+=($(check_field '.deployment.email.alert_email'))

if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
    error "Заполни следующие поля в deploy-config.json:\n  - ${MISSING_FIELDS[*]}"
fi

success "Конфигурация загружена"

# Чтение конфигурации
AWS_REGION=$(jq -r '.deployment.aws.region' deploy-config.json)
AWS_ACCOUNT_ID=$(jq -r '.deployment.aws.account_id' deploy-config.json)
BOT_TOKEN=$(jq -r '.deployment.telegram.bot_token' deploy-config.json)
BOT_USERNAME=$(jq -r '.deployment.telegram.bot_username' deploy-config.json)
ALERT_EMAIL=$(jq -r '.deployment.email.alert_email' deploy-config.json)
FROM_EMAIL=$(jq -r '.deployment.email.from_email' deploy-config.json)
PROJECT_NAME=$(jq -r '.deployment.environment.project_name' deploy-config.json)
ENVIRONMENT=$(jq -r '.deployment.environment.name' deploy-config.json)
FRONTEND_URL=$(jq -r '.deployment.environment.frontend_url' deploy-config.json)

# ============================================================================
# Генерация секретов
# ============================================================================

step "Генерация секретов"

generate_secret() {
    openssl rand -hex 32
}

JWT_SECRET_CONFIG=$(jq -r '.deployment.secrets.jwt_secret' deploy-config.json)
if [ "$JWT_SECRET_CONFIG" == "GENERATE_OR_LEAVE_AUTO" ]; then
    JWT_SECRET=$(generate_secret)
    success "JWT Secret сгенерирован"
else
    JWT_SECRET="$JWT_SECRET_CONFIG"
    info "Используется предоставленный JWT Secret"
fi

WEBHOOK_SECRET_CONFIG=$(jq -r '.deployment.telegram.webhook_secret' deploy-config.json)
if [ "$WEBHOOK_SECRET_CONFIG" == "GENERATE_OR_LEAVE_AUTO" ]; then
    WEBHOOK_SECRET=$(generate_secret)
    success "Webhook Secret сгенерирован"
else
    WEBHOOK_SECRET="$WEBHOOK_SECRET_CONFIG"
    info "Используется предоставленный Webhook Secret"
fi

info "JWT Secret: ${JWT_SECRET:0:10}..."
info "Webhook Secret: ${WEBHOOK_SECRET:0:10}..."

# ============================================================================
# Сохранение секретов в AWS Secrets Manager
# ============================================================================

step "Сохранение секретов в AWS Secrets Manager"

SECRET_PREFIX="$PROJECT_NAME/$ENVIRONMENT"

# JWT Secret
if aws secretsmanager describe-secret --secret-id "$SECRET_PREFIX/jwt-secret" &> /dev/null; then
    info "JWT Secret уже существует, обновляем..."
    aws secretsmanager update-secret --secret-id "$SECRET_PREFIX/jwt-secret" --secret-string "$JWT_SECRET" > /dev/null
else
    info "Создаем JWT Secret..."
    aws secretsmanager create-secret --name "$SECRET_PREFIX/jwt-secret" --secret-string "$JWT_SECRET" > /dev/null
fi
success "JWT Secret сохранен в AWS Secrets Manager"

# Telegram Bot Token
if aws secretsmanager describe-secret --secret-id "$SECRET_PREFIX/telegram-bot-token" &> /dev/null; then
    info "Telegram Bot Token уже существует, обновляем..."
    aws secretsmanager update-secret --secret-id "$SECRET_PREFIX/telegram-bot-token" --secret-string "$BOT_TOKEN" > /dev/null
else
    info "Создаем Telegram Bot Token..."
    aws secretsmanager create-secret --name "$SECRET_PREFIX/telegram-bot-token" --secret-string "$BOT_TOKEN" > /dev/null
fi
success "Telegram Bot Token сохранен в AWS Secrets Manager"

# ============================================================================
# Создание .env.production
# ============================================================================

step "Создание .env.production"

cat > lambda/.env.production << EOF
# Auto-generated by auto-deploy.sh
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

# Environment
NODE_ENV=$ENVIRONMENT
APP_VERSION=1.0.0

# AWS
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID

# DynamoDB
DYNAMODB_TABLE=$PROJECT_NAME-$ENVIRONMENT-table

# JWT
JWT_SECRET=$JWT_SECRET
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
TELEGRAM_BOT_USERNAME=$BOT_USERNAME
TELEGRAM_WEBHOOK_SECRET=$WEBHOOK_SECRET

# S3 Buckets
S3_BUCKET_AVATARS=$PROJECT_NAME-$ENVIRONMENT-avatars
S3_BUCKET_PORTFOLIO=$PROJECT_NAME-$ENVIRONMENT-portfolio
S3_BUCKET_ORDERS=$PROJECT_NAME-$ENVIRONMENT-orders
S3_BUCKET_PROJECTS=$PROJECT_NAME-$ENVIRONMENT-projects
S3_BUCKET_CHAT=$PROJECT_NAME-$ENVIRONMENT-chat
S3_BUCKET_DISPUTES=$PROJECT_NAME-$ENVIRONMENT-disputes

# Email
SES_FROM_EMAIL=$FROM_EMAIL
SES_REGION=$AWS_REGION

# Frontend
FRONTEND_URL=$FRONTEND_URL
CORS_ORIGIN=$FRONTEND_URL

# Monitoring
LOG_LEVEL=info
SENTRY_ENVIRONMENT=$ENVIRONMENT
EOF

success "Файл lambda/.env.production создан"

# ============================================================================
# Создание terraform.tfvars
# ============================================================================

step "Создание terraform.tfvars"

cat > lambda/terraform/terraform.tfvars << EOF
# Auto-generated by auto-deploy.sh
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

environment    = "$ENVIRONMENT"
aws_region     = "$AWS_REGION"
aws_account_id = "$AWS_ACCOUNT_ID"
project_name   = "$PROJECT_NAME"

dynamodb_table_name = "$PROJECT_NAME-$ENVIRONMENT-table"
s3_bucket_prefix    = "$PROJECT_NAME-$ENVIRONMENT"

lambda_memory_size = 512
lambda_timeout     = 30

alert_email        = "$ALERT_EMAIL"
log_retention_days = 30

tags = {
  Environment = "$ENVIRONMENT"
  Project     = "$PROJECT_NAME"
  ManagedBy   = "Terraform"
  DeployedBy  = "auto-deploy-script"
}
EOF

success "Файл lambda/terraform/terraform.tfvars создан"

# ============================================================================
# Установка зависимостей
# ============================================================================

step "Установка зависимостей"

cd lambda

if [ ! -d "node_modules" ]; then
    info "Устанавливаем npm зависимости..."
    npm install
    success "Зависимости установлены"
else
    info "Зависимости уже установлены"
fi

cd ..

# ============================================================================
# Запуск тестов
# ============================================================================

RUN_TESTS=$(jq -r '.deployment.options.run_tests' deploy-config.json)

if [ "$SKIP_TESTS" = false ] && [ "$RUN_TESTS" = "true" ]; then
    step "Запуск тестов"
    
    cd lambda
    
    if npm run test:pre-deploy; then
        success "Все тесты прошли успешно"
    else
        warning "Некоторые тесты не прошли"
        if [ "$AUTO_APPROVE" = false ]; then
            read -p "Продолжить деплой? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                error "Деплой отменен"
            fi
        fi
    fi
    
    cd ..
else
    warning "Тесты пропущены"
fi

# ============================================================================
# Сборка TypeScript
# ============================================================================

step "Сборка TypeScript"

cd lambda

info "Компилируем TypeScript..."
npm run build

success "TypeScript скомпилирован"

cd ..

# ============================================================================
# Упаковка Lambda функций
# ============================================================================

step "Упаковка Lambda функций"

cd lambda

info "Создаем ZIP архивы Lambda функций..."
node scripts/package-lambdas.js

ZIP_COUNT=$(ls -1 build/*.zip 2>/dev/null | wc -l)
success "Создано $ZIP_COUNT ZIP архивов"

cd ..

# ============================================================================
# Terraform Init
# ============================================================================

step "Terraform Init"

cd lambda/terraform

info "Инициализируем Terraform..."
terraform init

success "Terraform инициализирован"

# ============================================================================
# Terraform Validate
# ============================================================================

step "Terraform Validate"

info "Проверяем конфигурацию Terraform..."
terraform validate

success "Конфигурация Terraform валидна"

# ============================================================================
# Terraform Plan
# ============================================================================

SKIP_PLAN=$(jq -r '.deployment.options.skip_terraform_plan' ../../deploy-config.json)

if [ "$SKIP_PLAN" = "false" ] && [ "$DRY_RUN" = "false" ]; then
    step "Terraform Plan"
    
    info "Создаем план деплоя..."
    terraform plan -out=tfplan
    
    success "План создан"
    
    AUTO_APPROVE_CONFIG=$(jq -r '.deployment.options.auto_approve' ../../deploy-config.json)
    
    if [ "$AUTO_APPROVE" = "false" ] && [ "$AUTO_APPROVE_CONFIG" = "false" ]; then
        warning "\nПроверь план выше!"
        read -p "Продолжить деплой? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Деплой отменен"
        fi
    fi
fi

# ============================================================================
# Terraform Apply
# ============================================================================

if [ "$DRY_RUN" = "false" ]; then
    step "Terraform Apply"
    
    info "Начинаем деплой на AWS..."
    warning "Это займет 10-15 минут..."
    
    if [ "$SKIP_PLAN" = "true" ] || [ "$AUTO_APPROVE" = "true" ] || [ "$AUTO_APPROVE_CONFIG" = "true" ]; then
        terraform apply -auto-approve
    else
        terraform apply tfplan
    fi
    
    success "Деплой завершен успешно!"
    
    # Сохранение outputs
    info "Сохраняем outputs..."
    terraform output > ../deployment-outputs.txt
    
    # Получение API Gateway URL
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
    
    cd ../..
else
    info "Dry run завершен (деплой не выполнен)"
    cd ../..
    exit 0
fi

# ============================================================================
# Настройка Telegram Webhook
# ============================================================================

CONFIGURE_WEBHOOK=$(jq -r '.deployment.options.configure_telegram_webhook' deploy-config.json)

if [ "$CONFIGURE_WEBHOOK" = "true" ] && [ -n "$API_URL" ]; then
    step "Настройка Telegram Webhook"
    
    WEBHOOK_URL="$API_URL/auth/telegram/webhook"
    
    info "Устанавливаем webhook: $WEBHOOK_URL"
    
    RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$WEBHOOK_URL\", \"secret_token\": \"$WEBHOOK_SECRET\"}")
    
    if echo "$RESPONSE" | jq -e '.ok' > /dev/null; then
        success "Telegram webhook настроен"
    else
        warning "Ошибка настройки webhook: $(echo $RESPONSE | jq -r '.description')"
    fi
    
    # Проверка webhook
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
    info "Webhook URL: $(echo $WEBHOOK_INFO | jq -r '.result.url')"
    info "Pending updates: $(echo $WEBHOOK_INFO | jq -r '.result.pending_update_count')"
fi

# ============================================================================
# Проверка деплоя
# ============================================================================

step "Проверка деплоя"

if [ -n "$API_URL" ]; then
    info "API Gateway URL: $API_URL"
    
    # Тест health endpoint
    info "Тестируем health endpoint..."
    if HEALTH_RESPONSE=$(curl -s "$API_URL/health"); then
        if echo "$HEALTH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
            success "Health check прошел успешно"
        else
            warning "Health check вернул неожиданный статус"
        fi
    else
        warning "Health endpoint недоступен (может потребоваться время для прогрева)"
    fi
fi

# Проверка Lambda функций
info "Проверяем Lambda функции..."
LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '$PROJECT_NAME-$ENVIRONMENT')].FunctionName" --output json | jq '. | length')
success "Развернуто $LAMBDA_COUNT Lambda функций"

# Проверка DynamoDB
info "Проверяем DynamoDB таблицу..."
TABLE_STATUS=$(aws dynamodb describe-table --table-name "$PROJECT_NAME-$ENVIRONMENT-table" --query "Table.TableStatus" --output text)
success "DynamoDB таблица: $TABLE_STATUS"

# ============================================================================
# Создание отчета о деплое
# ============================================================================

step "Создание отчета о деплое"

cat > deployment-report.txt << EOF
# Deployment Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')

## Configuration
- Environment: $ENVIRONMENT
- Project: $PROJECT_NAME
- AWS Region: $AWS_REGION
- AWS Account: $AWS_ACCOUNT_ID

## Endpoints
- API Gateway URL: $API_URL
- Health Check: $API_URL/health

## Telegram Bot
- Bot Username: @$BOT_USERNAME
- Webhook URL: $API_URL/auth/telegram/webhook

## Resources Deployed
- Lambda Functions: $LAMBDA_COUNT
- DynamoDB Table: $PROJECT_NAME-$ENVIRONMENT-table
- S3 Buckets: 6

## Secrets (AWS Secrets Manager)
- $SECRET_PREFIX/jwt-secret
- $SECRET_PREFIX/telegram-bot-token

## Next Steps
1. Test Telegram bot: Open Telegram and search for @$BOT_USERNAME
2. Update mobile app with API URL: $API_URL
3. Monitor CloudWatch logs for errors
4. Setup monitoring and alarms

## Useful Commands
# View Lambda logs
aws logs tail /aws/lambda/$PROJECT_NAME-$ENVIRONMENT-auth-telegram-login --follow

# Check DynamoDB table
aws dynamodb describe-table --table-name $PROJECT_NAME-$ENVIRONMENT-table

# List all Lambda functions
aws lambda list-functions --query "Functions[?starts_with(FunctionName, '$PROJECT_NAME-$ENVIRONMENT')].FunctionName"
EOF

success "Отчет сохранен в deployment-report.txt"

# ============================================================================
# Завершение
# ============================================================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

step "Деплой завершен успешно! 🎉"

echo -e "${GREEN}"
cat << EOF

✓ Все компоненты развернуты
✓ API Gateway: $API_URL
✓ Telegram Bot: @$BOT_USERNAME
✓ Lambda Functions: $LAMBDA_COUNT
✓ DynamoDB: $TABLE_STATUS

Следующие шаги:
1. Протестируй Telegram бота
2. Обнови mobile app с новым API URL
3. Проверь CloudWatch logs
4. Настрой мониторинг

Документация: deployment-report.txt
Время деплоя: $((DURATION / 60)) минут $((DURATION % 60)) секунд
EOF
echo -e "${NC}"

success "Готово!"
