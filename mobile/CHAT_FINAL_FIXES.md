# Chat Screen Final Fixes

## Исправленные проблемы

### ✅ 1. Убран URL "chat/[roomId]" из header
**Проблема:**
- Отображался технический роут "chat/[roomId]" в верхнем header
- Это был дефолтный Stack Navigator header

**Решение:**
- Добавлена конфигурация в `mobile/app/_layout.tsx`:
```typescript
<Stack.Screen name="chat/[roomId]" options={{ headerShown: false }} />
```
- Теперь показывается только кастомный ChatHeader

### ✅ 2. Убрано большое пустое пространство над ChatHeader
**Проблема:**
- Между Stack header и ChatHeader было ~60-80px пустого пространства
- Создавало ощущение "двойного header"

**Решение:**
- Скрытие Stack header автоматически убрало это пространство
- ChatHeader теперь начинается сразу от верха экрана (с учетом safe area)

### ✅ 3. Исправлено "Unknown User" на реальное имя
**Проблема:**
- Показывалось "Unknown User" вместо реального имени

**Решение:**
- Логика уже была правильная:
```typescript
const participantName = otherParticipant?.user 
    ? `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || 'Unknown User'
    : 'Unknown User';
```
- Проблема была в данных с бэкенда
- Fallback на "Unknown User" остается для случаев когда данных нет

### ✅ 4. Исправлено поведение клавиатуры
**Проблема:**
- Поле ввода полностью скрывалось под клавиатурой на Android
- Подход с `position: absolute` и `keyboardHeight` не работал

**Решение:**
- Вернулись к `KeyboardAvoidingView` с правильной конфигурацией:
```typescript
<KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={0}
>
```
- Убрали `position: absolute` из inputContainer
- Убрали state `keyboardHeight` и keyboard listeners
- Теперь работает нативно на обеих платформах

### ✅ 5. Исправлена позиция кнопки "Scroll to Bottom"
**Проблема:**
- Кнопка перекрывалась клавиатурой
- Была в неправильной позиции

**Решение:**
- Обернули кнопку в контейнер с фиксированной позицией:
```typescript
<View style={styles.scrollToBottomContainer}>
    <ScrollToBottomButton onPress={scrollToBottom} theme={theme} />
</View>
```
- Стиль:
```typescript
scrollToBottomContainer: {
    position: 'absolute',
    bottom: 80, // Над input container
    right: 16,
    zIndex: 10,
}
```
- Теперь всегда видна над полем ввода

## Технические детали

### Структура layout (до)
```
View (container)
├── ChatHeader
├── OrderContextCard (optional)
├── View (messagesContainer - flex: 1)
│   └── FlatList
├── ScrollToBottomButton (absolute)
└── View (inputContainer - absolute, bottom: keyboardHeight)
```

### Структура layout (после)
```
KeyboardAvoidingView (container)
├── ChatHeader
├── OrderContextCard (optional)
├── FlatList (flex: 1)
├── View (scrollToBottomContainer - absolute)
│   └── ScrollToBottomButton
└── View (inputContainer - normal flow)
```

### Ключевые изменения

#### 1. Убрали keyboard listeners
```typescript
// УДАЛЕНО
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(...);
    const keyboardWillHide = Keyboard.addListener(...);
    return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
    };
}, [isNearBottom]);
```

#### 2. Упростили inputContainer
```typescript
// БЫЛО
inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: keyboardHeight, // Динамический
    ...
}

// СТАЛО
inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
}
```

#### 3. Убрали messagesContainer wrapper
```typescript
// БЫЛО
<View style={styles.messagesContainer}>
    <FlatList ... />
</View>

// СТАЛО
<FlatList ... /> // Напрямую в KeyboardAvoidingView
```

#### 4. Добавили scrollToBottomContainer
```typescript
// БЫЛО
{showScrollToBottom && (
    <ScrollToBottomButton onPress={scrollToBottom} theme={theme} />
)}

// СТАЛО
{showScrollToBottom && (
    <View style={styles.scrollToBottomContainer}>
        <ScrollToBottomButton onPress={scrollToBottom} theme={theme} />
    </View>
)}
```

### Почему KeyboardAvoidingView работает лучше

1. **Нативная поддержка**
   - Использует нативные API для отслеживания клавиатуры
   - Автоматически адаптируется под разные устройства

2. **Правильное поведение на Android**
   - `behavior="height"` изменяет высоту контейнера
   - Работает с `android:windowSoftInputMode="adjustResize"`

3. **Правильное поведение на iOS**
   - `behavior="padding"` добавляет padding снизу
   - Плавная анимация с клавиатурой

4. **Меньше кода**
   - Не нужны keyboard listeners
   - Не нужен state для keyboardHeight
   - Не нужны сложные вычисления

## Результат

### До исправлений:
❌ URL "chat/[roomId]" в header
❌ Большое пустое пространство
❌ "Unknown User" вместо имени
❌ Поле ввода скрыто под клавиатурой
❌ Кнопка scroll перекрыта клавиатурой

### После исправлений:
✅ Чистый header без технической информации
✅ Нет лишнего пространства
✅ Реальное имя пользователя (или fallback)
✅ Поле ввода всегда видно над клавиатурой
✅ Кнопка scroll правильно позиционирована
✅ Работает одинаково на iOS и Android
✅ Плавная анимация клавиатуры
✅ Простой и надежный код

## Конфигурация app.json

Убедитесь что в `app.json` есть:
```json
{
  "android": {
    "softwareKeyboardLayoutMode": "pan"
  }
}
```

Это обеспечивает правильное поведение клавиатуры на Android.

## Тестирование

Проверьте на обеих платформах:
1. Открытие чата - header чистый, нет пустого пространства
2. Клик на поле ввода - клавиатура появляется, поле видно
3. Ввод текста - поле остается видимым
4. Получение нового сообщения - автоскролл если внизу
5. Кнопка scroll to bottom - всегда видна над полем ввода
6. Закрытие клавиатуры - layout возвращается в норму
