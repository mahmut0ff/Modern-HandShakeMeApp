# Location Tracking Feature

Полнофункциональная система отслеживания местоположения мастера в реальном времени.

## Возможности

### Для мастера

1. **Активное отслеживание (MasterTrackingScreen)**
   - Запуск/остановка отслеживания местоположения
   - Карта с текущим местоположением в реальном времени
   - Отображение маршрута
   - Статистика в реальном времени (расстояние, скорость, время)
   - Настройки отслеживания (интервал обновления, точность)
   - Sharing ссылок на отслеживание

2. **История перемещений (TrackingHistoryScreen)**
   - Список всех сессий отслеживания
   - Фильтрация по периодам (неделя, месяц, все)
   - Детальный просмотр каждого маршрута
   - Карта с историческим маршрутом
   - Статистика по каждой сессии

3. **Статистика трекинга (TrackingStatisticsScreen)**
   - Общая статистика (сессии, расстояние, время)
   - Графики по дням (сессии, расстояние)
   - Популярные маршруты
   - Аналитика и инсайты
   - Фильтрация по периодам

### Для клиента

4. **Отслеживание мастера (ClientTrackingScreen)**
   - Просмотр текущего местоположения мастера
   - Автообновление каждые 10 секунд
   - Информация о скорости и точности
   - Открытие в Google Maps для навигации
   - Статус отслеживания (активно/неактивно)

### Sharing

5. **Публичное отслеживание (SharedTrackingScreen)**
   - Просмотр по публичной ссылке
   - Копирование и sharing ссылок
   - Контроль доступа (история, реал-тайм, статистика)
   - Автообновление для активных сессий

## Использование

### Навигация для мастера

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Открыть экран отслеживания
router.push('/location-tracking');
```

### Навигация для клиента

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Открыть отслеживание мастера
router.push({
  pathname: '/track-master',
  params: {
    bookingId: 'booking-123',
    // или
    projectId: 'project-456',
  },
});
```

### Прямое использование компонентов

```typescript
import {
  MasterTrackingScreen,
  ClientTrackingScreen,
  TrackingHistoryScreen,
  TrackingStatisticsScreen,
  SharedTrackingScreen,
} from '../features/location-tracking';

// Для мастера
<MasterTrackingScreen
  bookingId="booking-123"
  projectId="project-456"
  onBack={() => router.back()}
/>

// Для клиента
<ClientTrackingScreen
  bookingId="booking-123"
  masterId="master-789"
  onBack={() => router.back()}
/>

// История
<TrackingHistoryScreen
  masterId="master-789"
  onBack={() => router.back()}
/>

// Статистика
<TrackingStatisticsScreen
  masterId="master-789"
  onBack={() => router.back()}
/>

// Публичное отслеживание
<SharedTrackingScreen
  shareCode="abc123"
  trackingId="tracking-456"
  onBack={() => router.back()}
/>
```

## API

Все API методы доступны через `locationTrackingApi`:

```typescript
import { locationTrackingApi } from '../services/locationTrackingApi';

// Запуск отслеживания
const { tracking, trackingUrl } = await locationTrackingApi.startLocationTracking({
  bookingId: 'booking-123',
  location: {
    latitude: 42.8746,
    longitude: 74.5698,
  },
  trackingSettings: {
    updateInterval: 10,
    highAccuracyMode: true,
    shareWithClient: true,
  },
});

// Обновление местоположения
await locationTrackingApi.updateLocation({
  bookingId: 'booking-123',
  location: {
    latitude: 42.8746,
    longitude: 74.5698,
  },
});

// Остановка отслеживания
await locationTrackingApi.stopLocationTracking({
  bookingId: 'booking-123',
});

// Получение истории
const { locationHistory, routeStats } = await locationTrackingApi.getTrackingHistory({
  trackingId: 'tracking-456',
});

// Статистика
const stats = await locationTrackingApi.getTrackingStatistics({
  masterId: 'master-789',
  period: 'week',
});

// Sharing
const { trackingUrl, shareCode } = await locationTrackingApi.shareTrackingLink({
  trackingId: 'tracking-456',
  expirationHours: 24,
  allowAnonymous: true,
});
```

## Компоненты

### TrackingMap

Компонент карты для отображения местоположения и маршрутов:

```typescript
import { TrackingMap } from '../features/location-tracking';

<TrackingMap
  currentLocation={{
    latitude: 42.8746,
    longitude: 74.5698,
  }}
  locationHistory={[...]}
  destination={{
    latitude: 42.8800,
    longitude: 74.5800,
  }}
  showRoute={true}
  showGeofence={true}
  geofenceRadius={100}
  onMapReady={() => console.log('Map ready')}
/>
```

### ActiveTrackingCard

Карточка с информацией об активном отслеживании:

```typescript
import { ActiveTrackingCard } from '../features/location-tracking';

<ActiveTrackingCard
  tracking={trackingData}
  stats={statsData}
  onStop={async () => {
    await stopTracking();
  }}
  onShare={() => {
    shareTracking();
  }}
/>
```

## Разрешения

Для работы отслеживания необходимы разрешения на доступ к местоположению:

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Приложению необходим доступ к вашему местоположению для отслеживания маршрута."
        }
      ]
    ]
  }
}
```

## Зависимости

- `expo-location` - для доступа к GPS
- `react-native-maps` - для отображения карт
- `react-native-chart-kit` - для графиков статистики
- `@react-native-async-storage/async-storage` - для хранения токенов

## Оптимизация батареи

Система оптимизирована для минимального расхода батареи:

- Настраиваемый интервал обновления (по умолчанию 10 секунд)
- Минимальное расстояние для обновления (10 метров)
- Автоматическая остановка при завершении заказа
- Режим высокой/низкой точности

## Конфиденциальность

- Местоположение видно только клиенту текущего заказа
- Публичные ссылки имеют срок действия
- Контроль доступа к истории и статистике
- Возможность отключить sharing с клиентом

## Troubleshooting

### Отслеживание не запускается

1. Проверьте разрешения на доступ к местоположению
2. Убедитесь, что GPS включен на устройстве
3. Проверьте подключение к интернету

### Местоположение не обновляется

1. Проверьте настройки интервала обновления
2. Убедитесь, что приложение не в фоновом режиме
3. Проверьте точность GPS сигнала

### Карта не отображается

1. Проверьте API ключ Google Maps
2. Убедитесь, что `react-native-maps` правильно установлен
3. Проверьте подключение к интернету
