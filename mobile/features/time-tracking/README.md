# Time Tracking Module

Модуль учета рабочего времени для мастеров платформы HandShakeMe.

## Описание

Полнофункциональный модуль для отслеживания рабочего времени с поддержкой:
- Реал-тайм таймера
- Ручных записей
- Статистики и аналитики
- Шаблонов для быстрого старта
- Экспорта данных

## Компоненты

### ActiveTimer
Компонент активного таймера с кнопками управления (пауза/возобновление/остановка).

**Props:**
- `session: TimeTrackingSession` - Активная сессия
- `elapsedTime: { hours, minutes, seconds }` - Прошедшее время
- `onPause: (location?) => Promise<void>` - Обработчик паузы
- `onResume: (location?) => Promise<void>` - Обработчик возобновления
- `onStop: (data) => Promise<void>` - Обработчик остановки

### SessionCard
Карточка сессии для отображения в списке.

**Props:**
- `session: TimeTrackingSession` - Данные сессии
- `onPress: () => void` - Обработчик нажатия

### StatisticsCard
Карточка со статистикой по времени.

**Props:**
- `statistics: TimeStatistics` - Данные статистики

### StartSessionModal
Модальное окно для начала новой сессии.

**Props:**
- `visible: boolean` - Видимость модального окна
- `onClose: () => void` - Обработчик закрытия
- `onStart: (data) => Promise<void>` - Обработчик старта
- `projectId?: string` - ID проекта (опционально)
- `bookingId?: string` - ID бронирования (опционально)
- `templates?: TimeTrackingTemplate[]` - Шаблоны

## Экраны

### time-tracking.tsx
Главный экран модуля с активным таймером и списком сессий.

### time-tracking/[id].tsx
Детальный просмотр сессии с хронологией событий.

### time-tracking/statistics.tsx
Статистика и аналитика по времени с графиками.

### time-tracking/manual-entry.tsx
Форма для добавления ручной записи времени.

### time-tracking/templates.tsx
Управление шаблонами для быстрого старта сессий.

## API

Все API методы доступны через `timeTrackingApi`:

```typescript
import { timeTrackingApi } from '@/services/timeTrackingApi';

// Начать сессию
await timeTrackingApi.startTimeSession({
  taskType: 'WORK',
  description: 'Разработка',
  hourlyRate: 1500,
});

// Получить активную сессию
const { session, elapsedTime } = await timeTrackingApi.getActiveSession();

// Получить статистику
const stats = await timeTrackingApi.getTimeStatistics({ period: 'month' });
```

## Типы задач

- **WORK** - Основная работа
- **PREPARATION** - Подготовка к работе
- **TRAVEL** - Дорога к месту работы
- **BREAK** - Перерыв
- **CLEANUP** - Уборка после работы
- **DOCUMENTATION** - Документирование
- **OTHER** - Другое

## Статусы сессий

- **ACTIVE** - Активная сессия
- **PAUSED** - На паузе
- **COMPLETED** - Завершена
- **CANCELLED** - Отменена

## Использование

### Базовый пример

```typescript
import { useState, useEffect } from 'react';
import { ActiveTimer } from '@/features/time-tracking';
import { getActiveSession, pauseTimeSession } from '@/services/timeTrackingApi';

function MyComponent() {
  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    const data = await getActiveSession();
    setSession(data.session);
    setElapsedTime(data.elapsedTime);
  };

  const handlePause = async () => {
    await pauseTimeSession(session.id);
    await loadActiveSession();
  };

  if (!session) return null;

  return (
    <ActiveTimer
      session={session}
      elapsedTime={elapsedTime}
      onPause={handlePause}
      onResume={handleResume}
      onStop={handleStop}
    />
  );
}
```

## Стилизация

Модуль использует NativeWind (Tailwind CSS) для стилизации. Все компоненты адаптивны и поддерживают темную тему.

## Зависимости

- `@react-native-community/datetimepicker` - Выбор даты и времени
- `expo-location` - Геолокация
- `date-fns` - Работа с датами

## Тестирование

```bash
# Запустить тесты
npm test -- time-tracking

# Запустить с покрытием
npm test -- time-tracking --coverage
```

## Производительность

- Оптимизированный рендеринг списков
- Мемоизация компонентов
- Debounce для поисковых запросов
- Lazy loading для больших данных

## Доступность

Все компоненты поддерживают:
- Screen readers
- Keyboard navigation
- High contrast mode
- Font scaling

## Лицензия

Proprietary - HandShakeMe Platform
