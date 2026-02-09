# Header Spacing Fix - All Screens

## Проблема

На многих экранах приложения отображался двойной header:
1. Stack Navigator header (с URL/роутом)
2. Кастомный header компонент

Это создавало большое пустое пространство (~60-80px) между ними.

## Затронутые экраны

### Profile Screens
- ✅ `profile/edit` - Редактирование профиля
- ✅ `profile/portfolio` - Портфолио
- ✅ `profile/settings` - Настройки
- ✅ `profile/reviews` - Отзывы
- ✅ `profile/favorites` - Понравившиеся

### Job Screens
- ✅ `jobs/[id]/index` - Детали работы
- ✅ `jobs/[id]/applications` - Заявки на работу
- ✅ `jobs/[id]/review` - Отзыв о работе

### Other Screens
- ✅ `chat/[roomId]` - Комната чата
- ✅ `masters/[id]` - Профиль мастера
- ✅ `apply-job` - Подача заявки на работу

## Решение

Добавлена конфигурация в `mobile/app/_layout.tsx` для скрытия Stack Navigator header:

```typescript
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  
  {/* Chat */}
  <Stack.Screen name="chat/[roomId]" options={{ headerShown: false }} />
  
  {/* Profile */}
  <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
  <Stack.Screen name="profile/portfolio" options={{ headerShown: false }} />
  <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
  <Stack.Screen name="profile/reviews" options={{ headerShown: false }} />
  <Stack.Screen name="profile/favorites" options={{ headerShown: false }} />
  
  {/* Jobs */}
  <Stack.Screen name="jobs/[id]/index" options={{ headerShown: false }} />
  <Stack.Screen name="jobs/[id]/applications" options={{ headerShown: false }} />
  <Stack.Screen name="jobs/[id]/review" options={{ headerShown: false }} />
  
  {/* Masters */}
  <Stack.Screen name="masters/[id]" options={{ headerShown: false }} />
  
  {/* Apply */}
  <Stack.Screen name="apply-job" options={{ headerShown: false }} />
  
  {/* Modals */}
  <Stack.Screen name="create-job" options={{ presentation: 'modal', headerShown: false }} />
  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
</Stack>
```

## Результат

### До исправления:
```
┌─────────────────────────┐
│ profile/edit            │ ← Stack header (нежелательный)
├─────────────────────────┤
│                         │ ← Пустое пространство
│                         │
├─────────────────────────┤
│ ← Edit Profile    Save  │ ← Кастомный header
├─────────────────────────┤
│                         │
│   Content               │
│                         │
└─────────────────────────┘
```

### После исправления:
```
┌─────────────────────────┐
│ ← Edit Profile    Save  │ ← Только кастомный header
├─────────────────────────┤
│                         │
│   Content               │
│                         │
│                         │
└─────────────────────────┘
```

## Преимущества

1. **Чистый UI** - нет технической информации (URL/роутов)
2. **Больше места** - экономия ~60-80px на каждом экране
3. **Единообразие** - все экраны выглядят одинаково
4. **Профессиональный вид** - нет "сырого" ощущения
5. **Правильный safe area** - кастомные header'ы используют `useSafeAreaInsets()`

## Важные заметки

### Для новых экранов

При добавлении новых экранов с кастомным header, не забудьте добавить конфигурацию:

```typescript
<Stack.Screen name="new-screen" options={{ headerShown: false }} />
```

### Для экранов без кастомного header

Если экран использует дефолтный Stack header, НЕ добавляйте `headerShown: false`. Например:

```typescript
<Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
```

### Safe Area в кастомных header'ах

Убедитесь что все кастомные header'ы используют safe area:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
  {/* Header content */}
</View>
```

## Проверка

Проверьте все экраны на:
1. ✅ Нет двойного header
2. ✅ Нет пустого пространства сверху
3. ✅ Header начинается от верха (с учетом safe area)
4. ✅ Кнопка "назад" работает
5. ✅ Правильные отступы на устройствах с notch

## Структура файлов

```
mobile/app/
├── _layout.tsx              ← Конфигурация Stack Navigator
├── (tabs)/
│   └── ...
├── (auth)/
│   └── ...
├── chat/
│   └── [roomId].tsx         ← Кастомный ChatHeader
├── profile/
│   ├── edit.tsx             ← Кастомный header
│   ├── portfolio.tsx        ← Кастомный header
│   ├── settings.tsx         ← Кастомный header
│   ├── reviews.tsx          ← Кастомный header
│   └── favorites.tsx        ← Кастомный header
├── jobs/
│   └── [id]/
│       ├── index.tsx        ← Кастомный header
│       ├── applications.tsx ← Кастомный header
│       └── review.tsx       ← Кастомный header
├── masters/
│   └── [id].tsx             ← Кастомный header
├── apply-job.tsx            ← Кастомный header
└── create-job.tsx           ← Modal с кастомным header
```

## Тестирование

Протестируйте на:
- ✅ iOS (с notch и без)
- ✅ Android (разные версии)
- ✅ Разные размеры экранов
- ✅ Светлая и темная темы
- ✅ Навигация вперед/назад
- ✅ Deep links

Все должно работать без двойных header'ов и лишних отступов.
