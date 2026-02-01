# Localization System

Полнофункциональная система локализации для приложения с поддержкой трех языков: английский (en), русский (ru) и кыргызский (ky).

## Возможности

- ✅ Поддержка трех локалей: en, ru, ky
- ✅ Автоматическое определение локали из заголовков, параметров запроса и cookies
- ✅ Кэширование переводов для высокой производительности
- ✅ Плюрализация для разных языков
- ✅ Интерполяция переменных в переводах
- ✅ Валидация переводов
- ✅ Импорт/экспорт переводов
- ✅ API endpoints для управления переводами
- ✅ Статистика и аналитика переводов
- ✅ Middleware для автоматической локализации
- ✅ Форматирование дат, валют и чисел

## Архитектура

```
lambda/core/localization/
├── service.ts                 # Простой интерфейс для обратной совместимости
├── locales/                   # JSON файлы с переводами
│   ├── en.json
│   ├── ru.json
│   └── ky.json
├── get-translations.ts        # API: получить переводы
├── save-translation.ts        # API: сохранить перевод
├── import-translations.ts     # API: импорт переводов
├── delete-translation.ts      # API: удалить перевод
├── get-stats.ts              # API: статистика
├── seed-translations.ts       # Скрипт импорта в DynamoDB
└── README.md

lambda/core/shared/
├── services/
│   └── localization.service.ts    # Основной сервис
├── repositories/
│   └── localization.repository.ts # Репозиторий DynamoDB
├── types/
│   └── localization.ts           # Типы TypeScript
├── utils/
│   └── localization.ts           # Утилиты
└── middleware/
    └── localization.middleware.ts # Middleware
```

## Быстрый старт

### 1. Простое использование

```typescript
import { translate, formatDate, formatCurrency } from '../core/localization/service';

// Простой перевод
const greeting = await translate('welcome', 'ru'); // "Добро пожаловать"

// Форматирование
const date = formatDate(new Date(), 'ru'); // "15 января 2024 г."
const price = formatCurrency(1000, 'ru'); // "1 000 сом"
```

### 2. Расширенное использование

```typescript
import { LocalizationService } from '../core/shared/services/localization.service';

const localizationService = new LocalizationService();

// Перевод с переменными
const result = await localizationService.translate({
  key: 'errors.file_too_large',
  locale: 'ru',
  variables: { maxSize: '10MB' }
});
// "Файл слишком большой. Максимальный размер: 10MB."

// Плюрализация
const pluralResult = await localizationService.translate({
  key: 'items_count',
  locale: 'ru',
  count: 5
});
```

### 3. Использование middleware

```typescript
import { withLocalization } from '../core/shared/middleware/localization.middleware';

export const handler = withLocalization(async (event) => {
  // event.locale содержит определенную локаль
  // event.localizationContext содержит дополнительную информацию
  
  const greeting = await translate('welcome', event.locale);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: greeting })
  };
});
```

## API Endpoints

### GET /translations
Получить переводы

**Параметры:**
- `locale` - локаль (en, ru, ky)
- `keys` - список ключей через запятую
- `category` - категория переводов

**Примеры:**
```bash
# Все переводы для русского языка
GET /translations?locale=ru

# Конкретные ключи
GET /translations?locale=ru&keys=welcome,login,logout

# По категории
GET /translations?locale=ru&category=auth
```

### POST /translations
Сохранить перевод

```json
{
  "key": "new_key",
  "locale": "ru",
  "value": "Новое значение",
  "category": "general",
  "description": "Описание перевода"
}
```

### POST /translations/import
Импорт переводов

```json
{
  "locale": "ru",
  "translations": {
    "key1": "Значение 1",
    "key2": "Значение 2"
  },
  "category": "general",
  "overwrite": false
}
```

### DELETE /translations/{key}/{locale}
Удалить перевод

### GET /translations/stats
Получить статистику переводов

## Структура переводов

Переводы организованы в иерархическую структуру:

```json
{
  "auth": {
    "login": "Войти",
    "logout": "Выйти",
    "invalid_code": "Неверный код"
  },
  "orders": {
    "create_order": "Создать заказ",
    "order_created": "Заказ создан"
  },
  "errors": {
    "network_error": "Ошибка сети",
    "file_too_large": "Файл слишком большой. Максимум: {{maxSize}}"
  }
}
```

В коде используется точечная нотация: `auth.login`, `orders.create_order`, `errors.file_too_large`.

## Переменные в переводах

Используйте двойные фигурные скобки для переменных:

```json
{
  "welcome_user": "Добро пожаловать, {{name}}!",
  "items_found": "Найдено {{count}} элементов",
  "file_size_error": "Размер файла {{size}} превышает лимит {{maxSize}}"
}
```

```typescript
const message = await translate('welcome_user', 'ru', { name: 'Иван' });
// "Добро пожаловать, Иван!"
```

## Плюрализация

Для языков с множественными формами:

```json
{
  "items_count": {
    "one": "{{count}} элемент",
    "few": "{{count}} элемента", 
    "many": "{{count}} элементов",
    "other": "{{count}} элементов"
  }
}
```

```typescript
const message = await localizationService.translate({
  key: 'items_count',
  locale: 'ru',
  count: 5,
  variables: { count: 5 }
});
// "5 элементов"
```

## Настройка DynamoDB

Создайте таблицы DynamoDB:

### Таблица translations
```
Partition Key: pk (String)
Sort Key: sk (String)
GSI1: gsi1pk (String), gsi1sk (String)
```

### Таблица translation-cache
```
Partition Key: pk (String)
Sort Key: sk (String)
TTL: ttl (Number)
```

### Переменные окружения
```bash
TRANSLATIONS_TABLE=translations
TRANSLATION_CACHE_TABLE=translation-cache
AWS_REGION=us-east-1
```

## Импорт переводов в DynamoDB

```bash
# Импорт всех переводов
cd lambda
npm run seed-translations

# Импорт с перезаписью существующих
npm run seed-translations -- --overwrite

# Только предзагрузка кэша
npm run seed-translations -- --cache-only

# Только экспорт для проверки
npm run seed-translations -- --export-only
```

## Производительность

- **Кэширование**: Переводы кэшируются в памяти и DynamoDB
- **Batch операции**: Массовые операции используют batch API
- **TTL**: Автоматическое истечение кэша
- **Предзагрузка**: Возможность предварительной загрузки популярных переводов

## Мониторинг

Используйте endpoint `/translations/stats` для мониторинга:

```json
{
  "totalTranslations": 450,
  "byLocale": {
    "en": 150,
    "ru": 150,
    "ky": 150
  },
  "byCategory": {
    "general": 200,
    "auth": 50,
    "orders": 100,
    "errors": 100
  },
  "completeness": {
    "en": 100.0,
    "ru": 100.0,
    "ky": 95.5
  },
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## Лучшие практики

1. **Ключи**: Используйте описательные ключи с точечной нотацией
2. **Категории**: Группируйте переводы по функциональности
3. **Переменные**: Минимизируйте количество переменных в одном переводе
4. **Валидация**: Всегда валидируйте переводы перед сохранением
5. **Кэширование**: Предзагружайте часто используемые переводы
6. **Fallback**: Всегда предусматривайте fallback на английский язык

## Тестирование

```bash
# Запуск тестов
npm test -- localization

# Тесты с покрытием
npm run test:coverage -- localization
```

## Миграция с старой системы

Старые функции остаются доступными для обратной совместимости:

```typescript
// Старый способ (все еще работает)
import { translate } from '../core/localization/service';
const message = await translate('welcome', 'ru');

// Новый способ (рекомендуется)
import { LocalizationService } from '../core/shared/services/localization.service';
const service = new LocalizationService();
const result = await service.translate({ key: 'welcome', locale: 'ru' });
```

## Поддержка

Для вопросов и предложений создавайте issues в репозитории проекта.