# Примеры использования Location Tracking

## Пример 1: Базовое использование для мастера

```typescript
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function MasterDashboard() {
  const router = useRouter();

  return (
    <View>
      <TouchableOpacity
        onPress={() => router.push('/location-tracking')}
      >
        <Text>Открыть отслеживание</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Пример 2: Отслеживание для конкретного заказа

```typescript
import React from 'react';
import { MasterTrackingScreen } from '../features/location-tracking';

export default function OrderTracking({ orderId }: { orderId: string }) {
  return (
    <MasterTrackingScreen
      bookingId={orderId}
      onBack={() => {
        // Навигация назад
      }}
    />
  );
}
```

## Пример 3: Клиент отслеживает мастера

```typescript
import React from 'react';
import { ClientTrackingScreen } from '../features/location-tracking';

export default function TrackMaster({ bookingId }: { bookingId: string }) {
  return (
    <ClientTrackingScreen
      bookingId={bookingId}
      onBack={() => {
        // Навигация назад
      }}
    />
  );
}
```

## Пример 4: Программный запуск отслеживания

```typescript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as Location from 'expo-location';
import { locationTrackingApi } from '../services/locationTrackingApi';

export default function StartTracking({ bookingId }: { bookingId: string }) {
  const [tracking, setTracking] = useState(false);

  const startTracking = async () => {
    try {
      // Запросить разрешения
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к местоположению');
        return;
      }

      // Получить текущее местоположение
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Запустить отслеживание
      const response = await locationTrackingApi.startLocationTracking({
        bookingId,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
        },
        trackingSettings: {
          updateInterval: 10,
          highAccuracyMode: true,
          shareWithClient: true,
          autoStopAfterCompletion: true,
          geofenceRadius: 100,
        },
      });

      setTracking(true);
      Alert.alert('Успешно', 'Отслеживание запущено');
      console.log('Tracking URL:', response.trackingUrl);
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Ошибка', 'Не удалось запустить отслеживание');
    }
  };

  const stopTracking = async () => {
    try {
      await locationTrackingApi.stopLocationTracking({ bookingId });
      setTracking(false);
      Alert.alert('Успешно', 'Отслеживание остановлено');
    } catch (error) {
      console.error('Error stopping tracking:', error);
      Alert.alert('Ошибка', 'Не удалось остановить отслеживание');
    }
  };

  return (
    <View>
      {!tracking ? (
        <Button title="Начать отслеживание" onPress={startTracking} />
      ) : (
        <Button title="Остановить отслеживание" onPress={stopTracking} />
      )}
    </View>
  );
}
```

## Пример 5: Автоматическое обновление местоположения

```typescript
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { locationTrackingApi } from '../services/locationTrackingApi';

export default function AutoLocationUpdate({ bookingId }: { bookingId: string }) {
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startLocationUpdates();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const startLocationUpdates = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 секунд
        distanceInterval: 10, // 10 метров
      },
      async (location) => {
        try {
          await locationTrackingApi.updateLocation({
            bookingId,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
              altitude: location.coords.altitude || undefined,
              heading: location.coords.heading || undefined,
              speed: location.coords.speed || undefined,
            },
          });
          console.log('Location updated');
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }
    );

    setSubscription(sub);
  };

  return null;
}
```

## Пример 6: Sharing ссылки на отслеживание

```typescript
import React from 'react';
import { View, Button, Share, Alert } from 'react-native';
import { locationTrackingApi } from '../services/locationTrackingApi';

export default function ShareTracking({ trackingId }: { trackingId: string }) {
  const shareTracking = async () => {
    try {
      const response = await locationTrackingApi.shareTrackingLink({
        trackingId,
        expirationHours: 24,
        allowAnonymous: true,
      });

      await Share.share({
        message: `Отслеживайте мое местоположение: ${response.trackingUrl}`,
        url: response.trackingUrl,
        title: 'Поделиться местоположением',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Ошибка', 'Не удалось поделиться ссылкой');
      }
    }
  };

  return (
    <View>
      <Button title="Поделиться местоположением" onPress={shareTracking} />
    </View>
  );
}
```

## Пример 7: Просмотр истории перемещений

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { locationTrackingApi, LocationTracking } from '../services/locationTrackingApi';

export default function TrackingHistory({ masterId }: { masterId: string }) {
  const [sessions, setSessions] = useState<LocationTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await locationTrackingApi.getActiveSessions({
        masterId,
      });
      setSessions(response.sessions);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{formatDate(item.startedAt)}</Text>
            <Text>Статус: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

## Пример 8: Статистика трекинга

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { locationTrackingApi } from '../services/locationTrackingApi';

export default function TrackingStats({ masterId }: { masterId: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await locationTrackingApi.getTrackingStatistics({
        masterId,
        period: 'week',
      });
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!stats) return null;

  return (
    <View>
      <Text>Всего сессий: {stats.totalSessions}</Text>
      <Text>Общее расстояние: {(stats.totalDistance / 1000).toFixed(2)} км</Text>
      <Text>Общее время: {Math.floor(stats.totalDuration / 3600)} ч</Text>
      <Text>Средняя длительность: {Math.floor(stats.averageSessionDuration / 60)} мин</Text>
    </View>
  );
}
```

## Пример 9: Кастомная карта с маршрутом

```typescript
import React from 'react';
import { View } from 'react-native';
import { TrackingMap } from '../features/location-tracking';

export default function CustomMap() {
  const currentLocation = {
    latitude: 42.8746,
    longitude: 74.5698,
  };

  const locationHistory = [
    { latitude: 42.8746, longitude: 74.5698 },
    { latitude: 42.8756, longitude: 74.5708 },
    { latitude: 42.8766, longitude: 74.5718 },
  ];

  const destination = {
    latitude: 42.8800,
    longitude: 74.5800,
  };

  return (
    <View style={{ flex: 1 }}>
      <TrackingMap
        currentLocation={currentLocation}
        locationHistory={locationHistory}
        destination={destination}
        showRoute={true}
        showGeofence={true}
        geofenceRadius={100}
        onMapReady={() => console.log('Map ready')}
      />
    </View>
  );
}
```

## Пример 10: Интеграция с заказом

```typescript
import React, { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { locationTrackingApi } from '../services/locationTrackingApi';

export default function OrderWithTracking({ orderId }: { orderId: string }) {
  const [hasActiveTracking, setHasActiveTracking] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

  useEffect(() => {
    checkTracking();
  }, []);

  const checkTracking = async () => {
    try {
      const response = await locationTrackingApi.getCurrentLocation({
        bookingId: orderId,
      });

      if (response.tracking && response.tracking.status === 'ACTIVE') {
        setHasActiveTracking(true);
        // Получить ссылку для sharing
        const shareResponse = await locationTrackingApi.shareTrackingLink({
          trackingId: response.tracking.id,
          expirationHours: 24,
        });
        setTrackingUrl(shareResponse.trackingUrl);
      }
    } catch (error) {
      console.error('Error checking tracking:', error);
    }
  };

  return (
    <View>
      <Text>Заказ #{orderId}</Text>
      {hasActiveTracking ? (
        <View>
          <Text>Отслеживание активно</Text>
          {trackingUrl && (
            <Button
              title="Открыть карту"
              onPress={() => {
                // Открыть экран отслеживания
              }}
            />
          )}
        </View>
      ) : (
        <Text>Отслеживание не активно</Text>
      )}
    </View>
  );
}
```

## Пример 11: Уведомления о прибытии (с geofence)

```typescript
import React, { useEffect } from 'react';
import { locationTrackingApi } from '../services/locationTrackingApi';
import * as Notifications from 'expo-notifications';

export default function GeofenceNotifications({ bookingId }: { bookingId: string }) {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await locationTrackingApi.getCurrentLocation({
          bookingId,
        });

        // Проверить, находится ли мастер в зоне geofence
        // Это можно сделать на бэкенде и получать события
        const events = await locationTrackingApi.getTrackingEvents({
          trackingId: response.tracking.id,
          eventTypes: 'GEOFENCE_ENTER,ARRIVAL',
          limit: 1,
        });

        if (events.events.length > 0) {
          const lastEvent = events.events[0];
          if (lastEvent.eventType === 'GEOFENCE_ENTER') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Мастер приближается',
                body: 'Мастер находится рядом с местом назначения',
              },
              trigger: null,
            });
          }
        }
      } catch (error) {
        console.error('Error checking geofence:', error);
      }
    }, 30000); // Проверять каждые 30 секунд

    return () => clearInterval(interval);
  }, [bookingId]);

  return null;
}
```

## Пример 12: Оптимизация батареи

```typescript
import React, { useState } from 'react';
import { View, Switch, Text } from 'react-native';
import * as Location from 'expo-location';

export default function BatteryOptimization() {
  const [highAccuracy, setHighAccuracy] = useState(false);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  const updateAccuracyMode = async (enabled: boolean) => {
    setHighAccuracy(enabled);

    // Остановить текущую подписку
    if (subscription) {
      subscription.remove();
    }

    // Создать новую подписку с обновленными настройками
    const newSub = await Location.watchPositionAsync(
      {
        accuracy: enabled ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: enabled ? 10000 : 30000, // Более редкие обновления для экономии
        distanceInterval: enabled ? 10 : 50, // Больше расстояние для экономии
      },
      (location) => {
        console.log('Location updated:', location);
      }
    );

    setSubscription(newSub);
  };

  return (
    <View>
      <Text>Высокая точность (больше расход батареи)</Text>
      <Switch
        value={highAccuracy}
        onValueChange={updateAccuracyMode}
      />
    </View>
  );
}
```
