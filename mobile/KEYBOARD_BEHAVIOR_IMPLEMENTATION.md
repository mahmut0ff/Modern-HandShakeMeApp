# Правильное поведение клавиатуры в чате

## Реализованные принципы

### ✅ 1. Поднятие поля ввода вместе с клавиатурой
- Поле ввода использует `position: 'absolute'` с динамическим `bottom`
- На iOS: `bottom = keyboardHeight`
- На Android: `bottom = keyboardHeight - insets.bottom`
- Поле всегда прикреплено к верхней границе клавиатуры

### ✅ 2. Сообщения поднимаются вместе с полем ввода
- `messagesContainer` имеет `flex: 1` и автоматически уменьшается
- FlatList занимает всю доступную высоту
- Последнее сообщение остается видимым над полем ввода

### ✅ 3. Автоматический скролл вниз при фокусе
- Если пользователь внизу (`isNearBottom = true`):
  - Автоматически скроллит вниз при появлении клавиатуры
  - Автоматически скроллит при получении нового сообщения
- Если пользователь читает старые сообщения:
  - НЕ скроллит автоматически
  - Показывает кнопку "Scroll to bottom"

### ✅ 4. Плавная анимация
- iOS: использует `keyboardWillShow/Hide` для плавной анимации
- Android: использует `keyboardDidShow/Hide`
- Скролл с `animated: true` для плавности

### ✅ 5. Поле ввода фиксировано
- `position: 'absolute'` - не скроллится с сообщениями
- Всегда закреплено внизу экрана
- Только сообщения скроллятся

### ✅ 6. Поведение при закрытии клавиатуры
- `keyboardHeight` сбрасывается в 0
- Поле ввода опускается вниз (`bottom: 0`)
- Список сообщений возвращается к полной высоте
- Позиция скролла сохраняется

### ✅ 7. Новое сообщение при открытой клавиатуре
- Если пользователь внизу ИЛИ клавиатура открыта:
  - Автоматически скроллит к новому сообщению
- Если пользователь читает старые сообщения:
  - Показывает кнопку "Scroll to bottom"

### ✅ 8. Safe area поведение
- iOS: `paddingBottom: Math.max(insets.bottom, 8)`
- Android: `paddingBottom: 8`
- Учитывает home indicator на iPhone

### ✅ 9. Правильная структура layout
```
View (container - flex: 1)
├── ChatHeader (fixed)
├── OrderContextCard (optional, fixed)
├── View (messagesContainer - flex: 1)
│   └── FlatList (inverted)
└── View (inputContainer - position: absolute, bottom: keyboardHeight)
```

### ✅ 10. Что НЕ происходит
- ❌ Поле ввода НЕ перекрывается клавиатурой
- ❌ Последнее сообщение НЕ скрывается под клавиатурой
- ❌ Весь экран НЕ прыгает
- ❌ Header НЕ исчезает
- ❌ Поле ввода НЕ скроллится вместе с сообщениями

### ✅ 11. Дополнительное поведение
- При открытии чата: автоматически прокручен вниз (300ms delay)
- При фокусе input: положение сохраняется корректно
- При длинном чате: производительность не падает (inverted FlatList)
- `keyboardShouldPersistTaps="handled"` - клик по сообщению не закрывает клавиатуру
- `keyboardDismissMode="interactive"` - можно закрыть клавиатуру свайпом

### ✅ 12. Одинаковое поведение на iOS и Android
- Оба используют одинаковую логику
- Разница только в событиях клавиатуры (Will vs Did)
- Разница в расчете `bottom` (учет insets на Android)

## Технические детали

### Keyboard Listeners
```typescript
useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            if (isNearBottom) {
                setTimeout(() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, Platform.OS === 'ios' ? 0 : 100);
            }
        }
    );
    // ...
}, [isNearBottom]);
```

### Input Container Positioning
```typescript
const inputContainerBottom = Platform.OS === 'ios' 
    ? keyboardHeight 
    : keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0;

<View style={[styles.inputContainer, { bottom: inputContainerBottom }]} />
```

### Auto Scroll Logic
```typescript
// При новом сообщении
if (isNearBottom || keyboardHeight > 0) {
    setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
} else {
    setShowScrollToBottom(true);
}
```

## Результат

✅ Нажал input → keyboard появился → input поднялся → сообщения остались видны → можно сразу писать

✅ Ничего не перекрывается и не прыгает

✅ Плавная анимация на обеих платформах

✅ Правильное поведение при получении новых сообщений

✅ Учет safe area и home indicator

## Отличия от предыдущей реализации

### Было (неправильно):
- `KeyboardAvoidingView` с `behavior="padding"` или `"height"`
- Поле ввода в обычном потоке (не absolute)
- Клавиатура перекрывала input на Android
- Резкие скачки при появлении клавиатуры

### Стало (правильно):
- Без `KeyboardAvoidingView`
- Поле ввода с `position: 'absolute'`
- Динамический расчет `bottom` на основе `keyboardHeight`
- Плавная анимация на обеих платформах
- Правильное поведение скролла
