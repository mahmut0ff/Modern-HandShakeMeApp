# Portfolio CRUD Implementation

## Реализовано

### API Client (`mobile/src/api/portfolio.ts`)

Создан полноценный API клиент для работы с портфолио:

```typescript
export const portfolioApi = {
    listPortfolio(params?: ListPortfolioParams)
    getPortfolioItem(itemId: string)
    createPortfolioItem(data: CreatePortfolioItemRequest)
    updatePortfolioItem(itemId: string, data: UpdatePortfolioItemRequest)
    deletePortfolioItem(itemId: string)
    uploadPortfolioImage(imageUri: string)
}
```

### Portfolio Screen (`mobile/app/profile/portfolio.tsx`)

Реализован экран портфолио с:
- ✅ **List (Read)** - Отображение всех работ в сетке 2 колонки
- ✅ **Delete** - Удаление работ с подтверждением
- ⏳ **Create** - Заглушка (Coming Soon)
- ⏳ **Update** - Заглушка (Coming Soon)

## Структура данных

### PortfolioItem
```typescript
{
    id: string;
    title: string;
    description: string;
    images: string[];           // Массив URL изображений
    skills: string[];           // Массив навыков
    cost?: number;              // Стоимость работы
    durationDays?: number;      // Длительность в днях
    clientReview?: string;      // Отзыв клиента
    clientRating?: number;      // Рейтинг 1-5
    category?: {
        id: string;
        name: string;
    };
    isPublic: boolean;          // Публичная/приватная
    viewsCount: number;         // Количество просмотров
    createdAt: string;
    updatedAt?: string;
}
```

### CreatePortfolioItemRequest
```typescript
{
    title: string;              // Обязательно, 3-200 символов
    description: string;        // Обязательно, 10-1000 символов
    images: string[];           // Обязательно, 1-10 изображений
    skills: string[];           // Обязательно, до 20 навыков
    cost?: number;              // Опционально, положительное число
    durationDays?: number;      // Опционально, положительное число
    categoryId?: string;        // Опционально, UUID категории
    clientReview?: string;      // Опционально, до 500 символов
    clientRating?: number;      // Опционально, 1-5
    isPublic?: boolean;         // По умолчанию true
}
```

## API Endpoints

### List Portfolio
```
GET /portfolio
Query params:
  - masterId?: string
  - categoryId?: string
  - skills?: string (comma-separated)
  - isPublic?: boolean
  - includePrivate?: boolean
  - sortBy?: 'recent' | 'popular' | 'rating'
  - page?: number
  - pageSize?: number

Response: {
  results: PortfolioItem[],
  count: number,
  next: string | null,
  previous: string | null
}
```

### Create Portfolio Item
```
POST /portfolio
Body: CreatePortfolioItemRequest
Response: PortfolioItem
```

### Update Portfolio Item
```
PATCH /portfolio/:id
Body: UpdatePortfolioItemRequest (все поля опциональны)
Response: PortfolioItem
```

### Delete Portfolio Item
```
DELETE /portfolio/:id
Response: { message: string, itemId: string }
```

### Upload Image
```
POST /portfolio/upload-image
Body: FormData with 'image' field
Response: { url: string }
```

## UI Features

### Portfolio Grid
- 2 колонки
- Карточки с изображением
- Название работы
- Стоимость (если указана)
- Количество просмотров
- Badge "Private" для приватных работ
- Кнопка удаления

### Empty State
- Иконка портфеля
- Текст "No portfolio items yet"
- Подсказка "Showcase your work to attract more clients"
- Кнопка "Add Portfolio Item"

### Actions
- Pull-to-refresh для обновления списка
- Удаление с подтверждением
- Кнопка "+" в header для добавления

## Валидация (Lambda)

### Title
- Минимум 3 символа
- Максимум 200 символов

### Description
- Минимум 10 символов
- Максимум 1000 символов

### Images
- Минимум 1 изображение
- Максимум 10 изображений
- Валидация URL
- Проверка доступности изображения

### Skills
- Максимум 20 навыков
- Каждый навык 1-50 символов

### Cost & Duration
- Только положительные числа

### Client Rating
- Диапазон 1-5
- Требует clientReview если указан

### Limits
- Максимум 50 работ на мастера

## Что нужно доделать

### 1. Create Portfolio Item Screen
Создать экран добавления работы:
- Форма с полями: title, description, skills
- Загрузка изображений (1-10)
- Выбор категории
- Указание стоимости и длительности
- Переключатель Public/Private
- Опциональные поля: clientReview, clientRating

### 2. Edit Portfolio Item Screen
Создать экран редактирования:
- Загрузка существующих данных
- Те же поля что и в Create
- Возможность изменить изображения
- Сохранение изменений

### 3. Portfolio Item Detail Screen
Создать экран детального просмотра:
- Галерея изображений (swipeable)
- Полное описание
- Список навыков (chips)
- Информация о стоимости и длительности
- Отзыв клиента (если есть)
- Рейтинг клиента (звезды)
- Кнопки Edit и Delete

### 4. Image Upload
Реализовать загрузку изображений:
- ImagePicker для выбора из галереи
- Возможность сделать фото
- Crop/resize изображений
- Upload на S3 через API
- Progress indicator
- Превью загруженных изображений

### 5. Skills Management
Реализовать управление навыками:
- Autocomplete для существующих навыков
- Возможность добавить новый навык
- Chips для отображения выбранных
- Удаление навыка

### 6. Category Selection
Реализовать выбор категории:
- Список доступных категорий
- Поиск по категориям
- Отображение выбранной категории

## Пример использования

### Загрузка портфолио
```typescript
const response = await portfolioApi.listPortfolio({
    masterId: user?.id,
    includePrivate: true,
    sortBy: 'recent',
});
setPortfolioItems(response.data.results);
```

### Создание работы
```typescript
const newItem = await portfolioApi.createPortfolioItem({
    title: 'Modern Kitchen Renovation',
    description: 'Complete kitchen renovation with modern appliances...',
    images: ['https://...', 'https://...'],
    skills: ['Plumbing', 'Electrical', 'Carpentry'],
    cost: 5000,
    durationDays: 14,
    isPublic: true,
});
```

### Удаление работы
```typescript
await portfolioApi.deletePortfolioItem(itemId);
setPortfolioItems(prev => prev.filter(i => i.id !== itemId));
```

## Безопасность

### Lambda проверяет:
- ✅ Авторизация (JWT token)
- ✅ Роль пользователя (только MASTER)
- ✅ Владение работой (при update/delete)
- ✅ Лимит работ (максимум 50)
- ✅ Валидация изображений
- ✅ Валидация категории

### Кэширование
- Результаты списка кэшируются на 10 минут
- Инвалидация при create/update/delete
- Паттерн: `portfolio:{userId}*`

## Следующие шаги

1. **Создать экраны Create/Edit**
   - Форма с валидацией
   - Image picker
   - Skills selector
   - Category picker

2. **Создать экран Detail**
   - Image gallery
   - Full information display
   - Edit/Delete actions

3. **Интеграция с профилем мастера**
   - Показывать портфолио в профиле
   - Ссылка на полное портфолио

4. **Аналитика**
   - Отслеживание просмотров
   - Статистика по работам

5. **Поиск и фильтры**
   - Фильтр по категориям
   - Фильтр по навыкам
   - Сортировка

## Тестирование

Проверить:
- ✅ Загрузка списка работ
- ✅ Отображение в сетке
- ✅ Pull-to-refresh
- ✅ Удаление с подтверждением
- ✅ Empty state
- ⏳ Создание работы
- ⏳ Редактирование работы
- ⏳ Загрузка изображений
