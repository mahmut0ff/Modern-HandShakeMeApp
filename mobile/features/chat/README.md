# Chat Feature

Полнофункциональная система чата с поддержкой текстовых сообщений, изображений, файлов и real-time коммуникации.

## 📦 Компоненты

### MessageInput
Компонент ввода сообщений с поддержкой текста, изображений и файлов.

```typescript
<MessageInput
  value={message}
  onChangeText={setMessage}
  onSend={handleSend}
  onImagePick={handleImagePick}
  onFilePick={handleFilePick}
  onTyping={handleTyping}
  replyTo={replyTo}
  onCancelReply={() => setReplyTo(null)}
  editingMessage={editingMessage}
  onCancelEdit={() => setEditingMessage(null)}
/>
```

### MessageBubble
Пузырь сообщения с поддержкой текста, изображений, файлов и действий.

```typescript
<MessageBubble
  message={message}
  isOwnMessage={isOwnMessage}
  showAvatar={showAvatar}
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onImagePress={handleImagePress}
/>
```

### TypingIndicator
Анимированный индикатор печати.

```typescript
<TypingIndicator users={typingUsers} />
```

### ChatListItem
Элемент списка чатов.

```typescript
<ChatListItem
  room={room}
  currentUserRole="client"
  onPress={() => router.push(`/chat/${room.id}`)}
/>
```

### ImageViewer
Полноэкранный просмотр изображений.

```typescript
<ImageViewer
  visible={!!selectedImage}
  imageUrl={selectedImage || ''}
  onClose={() => setSelectedImage(null)}
/>
```

### ReplyPreview
Превью ответа на сообщение.

```typescript
<ReplyPreview
  message={replyTo}
  isEditing={false}
  onCancel={() => setReplyTo(null)}
/>
```

### EmptyChatRoom
Пустое состояние комнаты чата.

```typescript
<EmptyChatRoom />
```

### EmptyChatList
Пустое состояние списка чатов.

```typescript
<EmptyChatList isSearching={!!searchQuery} />
```

## 🎯 Возможности

- ✅ Текстовые сообщения
- ✅ Изображения (галерея + камера)
- ✅ Файлы (до 10 МБ)
- ✅ Typing indicators
- ✅ Read receipts (✓/✓✓)
- ✅ Reply (ответы)
- ✅ Edit (редактирование)
- ✅ Delete (удаление)
- ✅ Real-time через WebSocket
- ✅ Оптимистичные обновления
- ✅ Обработка ошибок

## 🧪 Тесты

```bash
# Запустить все тесты
npm test features/chat

# Запустить конкретный тест
npm test MessageInput.test.tsx
```

**Покрытие:** 28 unit тестов, ~85% coverage

## 📱 Использование

### Список чатов

```typescript
import { ChatListItem } from '../features/chat/components/ChatListItem';

<FlatList
  data={chatRooms}
  renderItem={({ item }) => (
    <ChatListItem
      room={item}
      currentUserRole="client"
      onPress={() => router.push(`/chat/${item.id}`)}
    />
  )}
/>
```

### Комната чата

```typescript
import { MessageBubble } from '../features/chat/components/MessageBubble';
import { MessageInput } from '../features/chat/components/MessageInput';
import { TypingIndicator } from '../features/chat/components/TypingIndicator';

<FlatList
  data={messages}
  renderItem={({ item }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.sender.id === user?.id}
      showAvatar={true}
      onReply={handleReply}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )}
  ListFooterComponent={
    <TypingIndicator users={typingUsers} />
  }
/>

<MessageInput
  value={message}
  onChangeText={setMessage}
  onSend={handleSend}
  onImagePick={handleImagePick}
  onFilePick={handleFilePick}
  onTyping={handleTyping}
/>
```

## 🔧 API

Все компоненты используют API из `services/chatApi.ts`:

- `useGetChatRoomsQuery()` - список чатов
- `useGetChatRoomQuery(id)` - детали чата
- `useGetChatMessagesQuery({ roomId })` - сообщения
- `useSendMessageMutation()` - отправка текста
- `useSendImageMessageMutation()` - отправка изображения
- `useSendFileMessageMutation()` - отправка файла
- `useEditMessageMutation()` - редактирование
- `useDeleteMessageMutation()` - удаление
- `useMarkMessageReadMutation()` - отметка прочитанным
- `useSetTypingMutation()` - typing indicator

## 🌐 WebSocket

Real-time функции через `hooks/useWebSocket.ts`:

```typescript
const {
  messages,
  typingUsers,
  sendMessage,
  markRead,
  updateTyping,
  isConnected
} = useChatRoom(roomId);
```

## 🎨 Стилизация

Все компоненты используют Tailwind CSS (NativeWind):

- Отправленные: `bg-blue-500`
- Полученные: `bg-gray-100`
- Онлайн: `bg-green-500`
- Непрочитанные: `bg-[#0165FB]`

## 📄 Лицензия

MIT
