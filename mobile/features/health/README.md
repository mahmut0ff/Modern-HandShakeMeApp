# Health Check & Monitoring Feature

Система мониторинга здоровья и диагностики приложения.

## Возможности

### 1. Статус системы (SystemStatusScreen)

**Мониторинг всех компонентов системы**

- ✅ Общий статус системы (healthy/degraded/unhealthy)
- ✅ Детальная информация по каждому сервису
- ✅ Основные сервисы:
  - База данных (DynamoDB)
  - Хранилище (S3)
  - Уведомления (SNS/SES)
  - Память Lambda
  - Конфигурация системы
- ✅ Внешние сервисы:
  - Telegram Bot
  - Yandex Maps
  - Email сервис
- ✅ Метаданные Lambda
- ✅ Версия и окружение
- ✅ Uptime системы
- ✅ Автообновление каждые 30 секунд
- ✅ Pull-to-refresh

### 2. Диагностика (DiagnosticsScreen)

**Проверка работоспособности приложения**

- ✅ Подключение к интернету
- ✅ Подключение к API
- ✅ Здоровье API
- ✅ Информация об устройстве
- ✅ Версия приложения
- ✅ Локальное хранилище
- ✅ Советы по устранению проблем
- ✅ Детальные результаты проверок

### 3. Индикатор API (ApiStatusIndicator)

**Компактный индикатор состояния API**

- ✅ Визуальный индикатор (зеленый/красный)
- ✅ Текстовая метка (опционально)
- ✅ Три размера (small/medium/large)
- ✅ Автообновление
- ✅ Настраиваемый интервал обновления
- ✅ Клик для перехода к деталям

## Использование

### Навигация к экранам

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Открыть статус системы
router.push('/system-health');
```

### Прямое использование компонентов

```typescript
import {
  SystemStatusScreen,
  DiagnosticsScreen,
  ApiStatusIndicator,
} from '../features/health';

// Статус системы
<SystemStatusScreen
  onBack={() => router.back()}
/>

// Диагностика
<DiagnosticsScreen
  onBack={() => router.back()}
/>

// Индикатор API
<ApiStatusIndicator
  onPress={() => router.push('/system-health')}
  showLabel={true}
  size="medium"
  autoRefresh={true}
  refreshInterval={60000}
/>
```

### Использование API

```typescript
import { healthApi } from '../services/healthApi';

// Детальный health check
const health = await healthApi.getHealthStatus();
console.log('Status:', health.status);
console.log('Uptime:', healthApi.formatUptime(health.uptime));

// Быстрая проверка
const simple = await healthApi.getSimpleHealth();
console.log('Healthy:', simple.healthy);

// Readiness probe
const ready = await healthApi.getReadiness();
console.log('Ready:', ready.ready);

// Liveness probe
const live = await healthApi.getLiveness();
console.log('Alive:', live.alive);

// Проверка подключения
const isConnected = await healthApi.checkApiConnection();
console.log('Connected:', isConnected);

// С повторными попытками
const healthWithRetry = await healthApi.getHealthStatusWithRetry(3, 1000);
```

## API

### Health Check Endpoints

**Детальный health check:**
```
GET /health
```

**Быстрая проверка:**
```
GET /health/simple
```

**Readiness probe:**
```
GET /health/ready
```

**Liveness probe:**
```
GET /health/live
```

### Типы данных

```typescript
// Статус здоровья
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
type CheckStatus = 'pass' | 'warn' | 'fail';

// Результат health check
interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  region: string;
  uptime: number;
  checks: HealthChecks;
  metadata?: {
    lambdaMemoryLimit?: string;
    lambdaMemoryUsed?: number;
    lambdaRemainingTime?: number;
    functionName?: string;
    nodeVersion?: string;
  };
}

// Детали проверки
interface HealthCheckDetail {
  status: CheckStatus;
  message?: string;
  lastChecked: string;
  responseTime?: number;
  details?: Record<string, any>;
}
```

### Утилиты

```typescript
// Форматирование uptime
const formatted = healthApi.formatUptime(123456789);
// "1д 10ч" или "5ч 23м" или "45м 12с"

// Получение цвета статуса
const color = healthApi.getStatusColor('healthy');
// "#10B981" (green)

// Получение иконки статуса
const icon = healthApi.getStatusIcon('pass');
// "checkmark-circle"

// Получение метки статуса
const label = healthApi.getStatusLabel('degraded');
// "Предупреждение"
```

## Интеграция в приложение

### В настройках

```typescript
import { ApiStatusIndicator } from '../features/health';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter();

  return (
    <View>
      {/* ... другие настройки ... */}
      
      <TouchableOpacity
        onPress={() => router.push('/system-health')}
        className="bg-white rounded-xl p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="pulse" size={24} color="#0165FB" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Статус системы
            </Text>
            <ApiStatusIndicator
              showLabel={true}
              size="small"
              autoRefresh={true}
            />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};
```

### В header приложения

```typescript
import { ApiStatusIndicator } from '../features/health';

const AppHeader = () => {
  return (
    <View className="flex-row items-center justify-between p-4">
      <Text className="text-xl font-bold">HandShakeMe</Text>
      <ApiStatusIndicator
        onPress={() => router.push('/system-health')}
        showLabel={false}
        size="small"
      />
    </View>
  );
};
```

### Проверка перед критическими операциями

```typescript
import { healthApi } from '../services/healthApi';

const performCriticalOperation = async () => {
  // Проверить доступность API
  const isHealthy = await healthApi.checkApiConnection();
  
  if (!isHealthy) {
    Alert.alert(
      'API недоступен',
      'Сервер временно недоступен. Попробуйте позже.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Диагностика', onPress: () => router.push('/system-health') },
      ]
    );
    return;
  }

  // Продолжить операцию
  // ...
};
```

## Мониторинг

### Автоматическая проверка при запуске

```typescript
import { useEffect } from 'react';
import { healthApi } from '../services/healthApi';

const App = () => {
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const health = await healthApi.getHealthStatus();
      
      if (health.status === 'unhealthy') {
        // Показать предупреждение
        Alert.alert(
          'Проблемы с системой',
          'Некоторые функции могут работать некорректно'
        );
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  return <YourApp />;
};
```

### Периодический мониторинг

```typescript
import { useEffect } from 'react';
import { healthApi } from '../services/healthApi';

const useHealthMonitoring = (interval: number = 60000) => {
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await healthApi.getSimpleHealth();
        
        if (!health.healthy) {
          // Логировать или показать уведомление
          console.warn('System unhealthy');
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
};
```

## Troubleshooting

### API недоступен

1. Проверьте подключение к интернету
2. Убедитесь, что `EXPO_PUBLIC_API_URL` настроен правильно
3. Проверьте, что сервер запущен
4. Используйте диагностику для детальной проверки

### Медленные проверки

1. Увеличьте timeout в `healthClient`
2. Используйте `getSimpleHealth()` вместо `getHealthStatus()`
3. Отключите автообновление или увеличьте интервал

### Ошибки в production

1. Проверьте логи CloudWatch
2. Убедитесь, что все переменные окружения настроены
3. Проверьте IAM права Lambda функций
4. Используйте readiness/liveness probes для мониторинга

## Зависимости

- `expo-network` - проверка сетевого подключения
- `expo-device` - информация об устройстве
- `expo-constants` - константы приложения
- `@react-native-async-storage/async-storage` - проверка хранилища

## Производительность

- Быстрая проверка (`getSimpleHealth`): ~100-200ms
- Детальная проверка (`getHealthStatus`): ~500-1000ms
- Диагностика: ~2-3 секунды

## Безопасность

- Health check endpoints не требуют авторизации
- Чувствительные данные скрыты в ответах
- Rate limiting на бэкенде
- Timeout для предотвращения зависаний

## Лучшие практики

1. Используйте `ApiStatusIndicator` в header для постоянного мониторинга
2. Проверяйте здоровье API перед критическими операциями
3. Показывайте пользователю понятные сообщения об ошибках
4. Логируйте проблемы для анализа
5. Используйте retry логику для временных сбоев
6. Настройте автоматические алерты для production

## Поддержка

Для вопросов по мониторингу:
- Документация API: `/health` endpoint
- CloudWatch Logs: Lambda функции
- Метрики: CloudWatch Metrics
