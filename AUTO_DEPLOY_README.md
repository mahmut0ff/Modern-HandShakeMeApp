# 🚀 Автоматический Деплой - Инструкция

Просто заполни конфиг и запусти скрипт!

---

## ⚡ Quick Start

### Шаг 1: Заполни конфиг (5 минут)

Открой `deploy-config.json` и заполни:

```json
{
  "deployment": {
    "aws": {
      "account_id": "123456789012"  // ← Твой AWS Account ID
    },
    
    "telegram": {
      "bot_token": "1234567890:ABC..."  // ← От @BotFather
      "bot_username": "your_bot"         // ← Имя бота без @
    },
    
    "email": {
      "from_email": "noreply@yourdomain.com",  // ← Твой email
      "alert_email": "your-email@example.com"   // ← Для алертов
    }
  }
}
```

**Остальные поля можно оставить как есть!**

### Шаг 2: Запусти скрипт

**Windows (PowerShell):**
```powershell
.\auto-deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x auto-deploy.sh
./auto-deploy.sh
```

### Шаг 3: Жди 15 минут ☕

Скрипт сделает всё сам:
- ✅ Сгенерирует секреты
- ✅ Создаст конфиг файлы
- ✅ Соберет код
- ✅ Задеплоит на AWS
- ✅ Настроит Telegram webhook
- ✅ Создаст отчет

**Готово!** 🎉

---

## 📋 Что Нужно Перед Запуском

### 1. Установленные программы
- [ ] AWS CLI (`aws --version`)
- [ ] Terraform (`terraform --version`)
- [ ] Node.js 18+ (`node --version`)

### 2. AWS Credentials
```bash
aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: us-east-1
```

### 3. Telegram Bot Token
1. Открой Telegram
2. Найди @BotFather
3. Отправь `/newbot`
4. Следуй инструкциям
5. Скопируй токен

### 4. AWS Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

---

## 📝 Конфигурация (deploy-config.json)

### Обязательные поля:

```json
{
  "aws": {
    "account_id": "YOUR_AWS_ACCOUNT_ID"  // ← ОБЯЗАТЕЛЬНО
  },
  "telegram": {
    "bot_token": "YOUR_BOT_TOKEN",       // ← ОБЯЗАТЕЛЬНО
    "bot_username": "your_bot"           // ← ОБЯЗАТЕЛЬНО
  },
  "email": {
    "alert_email": "your@email.com"      // ← ОБЯЗАТЕЛЬНО
  }
}
```

### Опциональные поля:

```json
{
  "secrets": {
    "jwt_secret": "GENERATE_OR_LEAVE_AUTO"  // ← Автогенерация
  },
  "domain": {
    "has_domain": false,  // ← true если есть домен
    "domain_name": "yourdomain.com"
  },
  "options": {
    "run_tests": true,              // ← Запускать тесты
    "auto_approve": false,          // ← Автоподтверждение
    "setup_monitoring": true,       // ← Настроить мониторинг
    "configure_telegram_webhook": true  // ← Настроить webhook
  }
}
```

---

## 🎯 Опции Запуска

### Windows (PowerShell):

```powershell
# Обычный запуск
.\auto-deploy.ps1

# Пропустить тесты
.\auto-deploy.ps1 -SkipTests

# Автоподтверждение (без вопросов)
.\auto-deploy.ps1 -AutoApprove

# Dry run (без деплоя)
.\auto-deploy.ps1 -DryRun

# Комбинация
.\auto-deploy.ps1 -SkipTests -AutoApprove
```

### Linux/Mac:

```bash
# Обычный запуск
./auto-deploy.sh

# Пропустить тесты
./auto-deploy.sh --skip-tests

# Автоподтверждение
./auto-deploy.sh --auto-approve

# Dry run
./auto-deploy.sh --dry-run

# Комбинация
./auto-deploy.sh --skip-tests --auto-approve
```

---

## 📊 Что Делает Скрипт

### 1. Проверка (1 минута)
- ✅ AWS CLI установлен
- ✅ Terraform установлен
- ✅ Node.js установлен
- ✅ AWS credentials настроены
- ✅ Конфиг файл заполнен

### 2. Генерация секретов (1 минута)
- ✅ JWT Secret (32 символа)
- ✅ Webhook Secret (32 символа)
- ✅ Сохранение в AWS Secrets Manager

### 3. Создание конфигов (1 минута)
- ✅ lambda/.env.production
- ✅ lambda/terraform/terraform.tfvars

### 4. Сборка (3 минуты)
- ✅ npm install
- ✅ npm run test (опционально)
- ✅ npm run build
- ✅ Упаковка Lambda функций

### 5. Деплой (10-15 минут)
- ✅ terraform init
- ✅ terraform validate
- ✅ terraform plan
- ✅ terraform apply
- ✅ ~150 Lambda функций
- ✅ DynamoDB таблица
- ✅ API Gateway
- ✅ S3 buckets

### 6. Настройка (1 минута)
- ✅ Telegram webhook
- ✅ Проверка health endpoint
- ✅ Создание отчета

**Итого: 15-20 минут**

---

## 📄 Созданные Файлы

После запуска скрипта будут созданы:

```
lambda/
  .env.production              ← Environment variables
  terraform/
    terraform.tfvars           ← Terraform variables
    tfplan                     ← Terraform plan
  deployment-outputs.txt       ← Terraform outputs
  build/                       ← ZIP архивы Lambda

deployment-report.txt          ← Отчет о деплое
```

---

## 🔍 Проверка Деплоя

### Автоматическая проверка

Скрипт автоматически проверит:
- ✅ Health endpoint
- ✅ Lambda функции
- ✅ DynamoDB таблица
- ✅ Telegram webhook

### Ручная проверка

```bash
# API Gateway URL
cat lambda/deployment-outputs.txt

# Test health
curl https://YOUR_API_URL/health

# Test Telegram bot
# Открой Telegram → найди своего бота → /start

# Check logs
aws logs tail /aws/lambda/handshakeme-production-auth-telegram-login --follow
```

---

## 🐛 Troubleshooting

### Ошибка: "AWS credentials не настроены"

**Решение:**
```bash
aws configure
```

### Ошибка: "Terraform не установлен"

**Решение:**
- Windows: `choco install terraform`
- Mac: `brew install terraform`
- Linux: https://www.terraform.io/downloads

### Ошибка: "AccessDenied"

**Решение:** Проверь IAM permissions
```bash
aws iam get-user
```

Нужны права:
- AmazonDynamoDBFullAccess
- AWSLambda_FullAccess
- AmazonAPIGatewayAdministrator
- AmazonS3FullAccess
- IAMFullAccess

### Ошибка: "Telegram webhook failed"

**Решение:** Проверь токен
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"
```

### Ошибка: "npm install failed"

**Решение:**
```bash
cd lambda
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 Повторный Деплой

Если нужно обновить деплой:

```bash
# Просто запусти скрипт снова
.\auto-deploy.ps1

# Или обнови только Lambda
cd lambda
npm run build
node scripts/package-lambdas.js
cd terraform
terraform apply
```

---

## 🗑️ Удаление Деплоя

```bash
cd lambda/terraform
terraform destroy
```

**Внимание:** Это удалит ВСЕ ресурсы!

---

## 💰 Стоимость

После деплоя:
- **Lambda:** ~$20-50/месяц
- **DynamoDB:** ~$25-100/месяц
- **API Gateway:** ~$3.50/месяц
- **S3:** ~$5-20/месяц
- **CloudWatch:** ~$5-10/месяц

**Итого:** ~$60-200/месяц

---

## 📞 Поддержка

### Логи скрипта
Все логи выводятся в консоль с цветами:
- 🟢 Зеленый = Успех
- 🔵 Синий = Информация
- 🟡 Желтый = Предупреждение
- 🔴 Красный = Ошибка

### Отчет о деплое
После деплоя открой `deployment-report.txt`

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

---

## ✅ Checklist

Перед запуском скрипта:
- [ ] AWS CLI установлен
- [ ] Terraform установлен
- [ ] Node.js установлен
- [ ] AWS credentials настроены
- [ ] Telegram bot создан
- [ ] deploy-config.json заполнен
- [ ] AWS Account ID известен

После деплоя:
- [ ] Health endpoint работает
- [ ] Telegram bot отвечает
- [ ] Mobile app обновлен с API URL
- [ ] CloudWatch logs проверены
- [ ] Мониторинг настроен

---

## 🎉 Готово!

Теперь у тебя есть:
- ✅ Автоматический деплой в 1 команду
- ✅ Все конфиги генерируются автоматически
- ✅ Секреты хранятся в AWS Secrets Manager
- ✅ Полный отчет о деплое
- ✅ Готовое production окружение

**Просто заполни `deploy-config.json` и запусти скрипт!** 🚀

---

**Вопросы?** Проверь `deployment-report.txt` после деплоя!
