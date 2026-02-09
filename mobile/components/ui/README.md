# UI Components Library

Современная библиотека UI компонентов для мобильного приложения.

## Компоненты

### Card
Универсальная карточка с тенями и скругленными углами.

```tsx
<Card padding={16}>
  <Text>Content</Text>
</Card>
```

**Props:**
- `children`: React.ReactNode
- `style?`: ViewStyle
- `padding?`: number (default: 16)
- `noPadding?`: boolean

### Button
Кнопка с тремя вариантами стиля.

```tsx
<Button
  title="Click me"
  variant="primary"
  size="medium"
  onPress={() => {}}
/>
```

**Props:**
- `title`: string
- `onPress`: () => void
- `variant?`: 'primary' | 'secondary' | 'outline'
- `size?`: 'small' | 'medium' | 'large'
- `disabled?`: boolean
- `loading?`: boolean
- `icon?`: React.ReactNode

### Input
Поле ввода с поддержкой иконок и ошибок.

```tsx
<Input
  label="Email"
  placeholder="Enter email"
  leftIcon={<Ionicons name="mail" size={20} />}
  error="Invalid email"
/>
```

**Props:**
- Все props от TextInput
- `label?`: string
- `error?`: string
- `leftIcon?`: React.ReactNode
- `rightIcon?`: React.ReactNode

### Header
Заголовок экрана с двумя вариантами.

```tsx
// Обычный
<Header
  title="Profile"
  showBack
  onBackPress={() => {}}
/>

// Цветной
<Header
  variant="colored"
  subtitle="Good morning"
  title="John"
  location="New York"
/>
```

**Props:**
- `title?`: string
- `subtitle?`: string
- `location?`: string
- `showBack?`: boolean
- `onBackPress?`: () => void
- `rightAction?`: React.ReactNode
- `variant?`: 'default' | 'colored'

### SearchBar
Поле поиска с иконкой.

```tsx
<SearchBar
  placeholder="Search..."
  onSearch={(text) => console.log(text)}
/>
```

**Props:**
- Все props от TextInput
- `onSearch?`: (text: string) => void

### CategoryCard
Карточка категории с иконкой.

```tsx
<CategoryCard
  icon="hammer-outline"
  label="Renovation"
  onPress={() => {}}
  selected={false}
/>
```

**Props:**
- `icon`: keyof typeof Ionicons.glyphMap
- `label`: string
- `onPress`: () => void
- `selected?`: boolean

### WorkCard
Карточка работы/заказа.

```tsx
<WorkCard
  title="Fix kitchen sink"
  description="Need plumber"
  price="$200"
  location="New York"
  status="Active"
  urgent={true}
  applicationsCount={5}
  onPress={() => {}}
/>
```

**Props:**
- `title`: string
- `description?`: string
- `price?`: string
- `location?`: string
- `date?`: string
- `status?`: string
- `urgent?`: boolean
- `applicationsCount?`: number
- `onPress`: () => void

### MasterCard
Карточка мастера.

```tsx
<MasterCard
  name="John Doe"
  avatar="https://..."
  rating={4.8}
  reviewsCount={123}
  specialization="Plumber"
  location="New York"
  price="$50/hr"
  verified={true}
  onPress={() => {}}
/>
```

**Props:**
- `name`: string
- `avatar?`: string
- `rating?`: number
- `reviewsCount?`: number
- `specialization?`: string
- `location?`: string
- `price?`: string
- `verified?`: boolean
- `onPress`: () => void

### SectionHeader
Заголовок секции с действием.

```tsx
<SectionHeader
  title="Popular Services"
  actionText="View all"
  onActionPress={() => {}}
  badge={5}
/>
```

**Props:**
- `title`: string
- `actionText?`: string
- `onActionPress?`: () => void
- `badge?`: number

### ScreenContainer
Контейнер для экрана.

```tsx
<ScreenContainer withPadding={true}>
  {/* Content */}
</ScreenContainer>
```

**Props:**
- `children`: React.ReactNode
- `style?`: ViewStyle
- `withPadding?`: boolean

## Использование

```tsx
import {
  Card,
  Button,
  Input,
  Header,
  SearchBar,
  CategoryCard,
  WorkCard,
  MasterCard,
  SectionHeader,
  ScreenContainer,
} from '@/components/ui';
```

## Темизация

Все компоненты автоматически поддерживают светлую и темную тему через `useColorScheme` hook.

```tsx
const colorScheme = useColorScheme() ?? 'light';
const theme = Colors[colorScheme];
```

## Стилизация

Все компоненты принимают `style` prop для кастомизации:

```tsx
<Card style={{ marginBottom: 20 }}>
  <Button style={{ width: '100%' }} />
</Card>
```
