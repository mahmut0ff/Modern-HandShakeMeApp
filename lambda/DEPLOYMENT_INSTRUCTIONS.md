# Deployment Instructions for Dashboard Stats

## Новые Lambda функции

Добавлены две новые Lambda функции для dashboard статистики:

1. **Client Dashboard Stats** (`get-client-dashboard-stats.ts`)
   - Endpoint: `GET /clients/me/dashboard-stats`
   - Возвращает: active_orders, completed_orders, total_spent, favorite_masters

2. **Master Dashboard Stats** (`get-master-dashboard-stats.ts`)
   - Endpoint: `GET /masters/me/dashboard-stats`
   - Возвращает: active_orders, completed_orders, total_earned, average_rating, pending_applications, unread_messages

## Шаги для деплоя

### 1. Сборка TypeScript

```bash
npm run build
```

### 2. Упаковка Lambda функций

**Linux/Mac:**
```bash
chmod +x scripts/package-dashboard-stats.sh
./scripts/package-dashboard-stats.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\package-dashboard-stats.ps1
```

### 3. Terraform Apply

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Обновленные файлы Terraform

- `lambda-phase1-profiles.tf` - добавлены Lambda функции
- `api-routes-phase1-profiles.tf` - добавлены API routes

## Проверка деплоя

После деплоя проверьте endpoints:

```bash
# Client Dashboard Stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-gateway-url/clients/me/dashboard-stats

# Master Dashboard Stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-gateway-url/masters/me/dashboard-stats
```

## Переменные окружения

Lambda функции используют следующие переменные:

- `ORDERS_TABLE` - таблица заказов
- `APPLICATIONS_TABLE` - таблица откликов
- `MASTERS_TABLE` - таблица мастеров
- `CHAT_ROOMS_TABLE` - таблица чатов
- `JWT_SECRET_ARN` - ARN секрета JWT
- `AWS_REGION` - регион AWS

## Rollback

Если нужно откатить изменения:

```bash
cd terraform
terraform plan -destroy -target=aws_lambda_function.clients_dashboard_stats
terraform plan -destroy -target=aws_lambda_function.masters_dashboard_stats
```

## Мониторинг

После деплоя проверьте CloudWatch Logs:

```bash
aws logs tail /aws/lambda/your-prefix-clients-dashboard-stats --follow
aws logs tail /aws/lambda/your-prefix-masters-dashboard-stats --follow
```
