# 🚀 START HERE - Автоматический Деплой

## ⚡ 3 Простых Шага

### 1️⃣ Заполни `deploy-config.json` (5 минут)

Открой файл `deploy-config.json` и заполни **только эти 4 поля**:

```json
{
  "deployment": {
    "aws": {
      "account_id": "123456789012"  // ← Вставь свой AWS Account ID
    },
    "telegram": {
      "bot_token": "1234567890:ABC...",  // ← Токен от @BotFather
      "bot_username": "your_bot"          // ← Имя бота без @
    },
    "email": {
      "alert_email": "your@email.com"     // ← Твой email
    }
  }
}
```

**Где взять:**

**AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

**Telegram Bot Token:**
1. Открой Telegram
2. Найди @BotFather
3. Отправь `/newbot`
4. Следуй инструкциям
5. Скопируй токен

### 2️⃣ Запусти скрипт (1 команда)

**Windows:**
```powershell
.\auto-deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x auto-deploy.sh
./auto-deploy.sh
```

### 3️⃣ Жди 15 минут ☕

Скрипт сделает всё автоматически!

---

## ✅ Что Нужно Установить

Перед запуском убедись что установлено:

- [ ] **AWS CLI** - `aws --version`
  - Windows: https://aws.amazon.com/cli/
  - Mac: `brew install awscli`
  - Linux: `sudo apt install awscli`

- [ ] **Terraform** - `terraform --version`
  - Windows: https://www.terraform.io/downloads
  - Mac: `brew install terraform`
  - Linux: `sudo apt install terraform`

- [ ] **Node.js 18+** - `node --version`
  - https://nodejs.org/

- [ ] **AWS Credentials** - `aws configure`
  ```bash
  aws configure
  # AWS Access Key ID: YOUR_KEY
  # AWS Secret Access Key: YOUR_SECRET
  # Default region: us-east-1
  ```

---

## 📋 Что Делает Скрипт

1. ✅ Проверяет зависимости
2. ✅ Генерирует секреты (JWT, Webhook)
3. ✅ Сохраняет секреты в AWS Secrets Manager
4. ✅ Создает конфиг файлы
5. ✅ Устанавливает npm зависимости
6. ✅ Запускает тесты (опционально)
7. ✅ Компилирует TypeScript
8. ✅ Упаковывает Lambda функции
9. ✅ Деплоит на AWS (~150 Lambda функций)
10. ✅ Настраивает Telegram webhook
11. ✅ Проверяет деплой
12. ✅ Создает отчет

**Время:** 15-20 минут

---

## 🎯 После Деплоя

### 1. Проверь API
```bash
# API URL будет в выводе скрипта
curl https://YOUR_API_URL/health
```

### 2. Проверь Telegram бота
1. Открой Telegram
2. Найди своего бота
3. Отправь `/start`
4. Бот должен ответить

### 3. Обнови Mobile App
```bash
cd mobile
# Обнови .env с новым API URL
echo "API_URL=https://YOUR_API_URL" > .env
```

### 4. Проверь логи
```bash
aws logs tail /aws/lambda/handshakeme-production-auth-telegram-login --follow
```

---

## 📄 Созданные Файлы

После деплоя:
- ✅ `lambda/.env.production` - Environment variables
- ✅ `lambda/terraform/terraform.tfvars` - Terraform config
- ✅ `lambda/deployment-outputs.txt` - API URLs
- ✅ `deployment-report.txt` - Полный отчет

---

## 🐛 Проблемы?

### "AWS credentials не настроены"
```bash
aws configure
```

### "Terraform не установлен"
- Windows: `choco install terraform`
- Mac: `brew install terraform`
- Linux: https://www.terraform.io/downloads

### "Поля не заполнены"
Проверь `deploy-config.json`:
- `account_id` не должен быть "YOUR_AWS_ACCOUNT_ID"
- `bot_token` не должен быть "YOUR_TELEGRAM_BOT_TOKEN"
- `bot_username` не должен быть "your_bot_username"
- `alert_email` не должен быть "your-email@example.com"

### Другие проблемы
Открой `deployment-report.txt` после деплоя

---

## 💰 Стоимость

После деплоя AWS будет стоить:
- **Development:** ~$10-30/месяц
- **Production:** ~$50-300/месяц

---

## 📚 Документация

- **AUTO_DEPLOY_README.md** - Детальная инструкция
- **DEPLOYMENT_GUIDE.md** - Ручной деплой
- **DEPLOYMENT_COMMANDS.md** - Все команды

---

## 🎉 Готово!

После успешного деплоя у тебя будет:
- ✅ ~150 Lambda функций
- ✅ API Gateway
- ✅ DynamoDB таблица
- ✅ 6 S3 buckets
- ✅ Настроенный Telegram бот
- ✅ Готовое production окружение

**Просто заполни конфиг и запусти скрипт!** 🚀

---

## ⚙️ Опции Запуска

```bash
# Пропустить тесты
.\auto-deploy.ps1 -SkipTests

# Автоподтверждение (без вопросов)
.\auto-deploy.ps1 -AutoApprove

# Dry run (проверка без деплоя)
.\auto-deploy.ps1 -DryRun

# Комбинация
.\auto-deploy.ps1 -SkipTests -AutoApprove
```

---

**Вопросы?** Читай `AUTO_DEPLOY_README.md`
