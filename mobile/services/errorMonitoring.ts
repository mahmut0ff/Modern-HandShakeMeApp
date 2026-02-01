/**
 * Error Monitoring Service
 * Сервис для мониторинга ошибок с помощью Sentry
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Sentry DSN (должен быть в переменных окружения)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

// Инициализация Sentry
export const initializeErrorMonitoring = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',

    // Настройки для React Native
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Настройки производительности
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Фильтрация ошибок
    beforeSend(event, hint) {
      // Не отправлять ошибки в development
      if (__DEV__) {
        console.log('Sentry Event (DEV):', event);
        return null;
      }

      // Фильтровать известные безвредные ошибки
      const error = hint.originalException;
      if (error instanceof Error) {
        // Игнорировать сетевые ошибки timeout
        if (error.message.includes('Network request failed') ||
          error.message.includes('timeout')) {
          return null;
        }

        // Игнорировать ошибки отмены запросов
        if (error.message.includes('AbortError') ||
          error.message.includes('cancelled')) {
          return null;
        }
      }

      return event;
    },

    // Интеграции
    integrations: [
      (Sentry as any).reactNativeTracingIntegration({
        // Трекинг навигации
        routingInstrumentation: (Sentry as any).reactNavigationIntegration(),

        // Трекинг производительности
        enableNativeFramesTracking: !__DEV__,
        enableStallTracking: !__DEV__,
      }),
    ],
  });

  // Установка контекста пользователя
  Sentry.setContext('device', {
    platform: Platform.OS,
    version: Platform.Version,
    model: Constants.deviceName,
    brand: Constants.brand,
  });

  Sentry.setContext('app', {
    version: Constants.expoConfig?.version,
    buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
    environment: __DEV__ ? 'development' : 'production',
  });
};

// Класс для управления ошибками
export class ErrorMonitoringService {

  /**
   * Логирование ошибки
   */
  static logError(error: Error, context?: Record<string, any>) {
    console.error('Error logged:', error);

    if (context) {
      Sentry.setContext('error_context', context);
    }

    Sentry.captureException(error);
  }

  /**
   * Логирование сообщения
   */
  static logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, any>) {
    console.log(`[${level.toUpperCase()}] ${message}`, extra);

    if (extra) {
      Sentry.setContext('message_context', extra);
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Установка пользователя
   */
  static setUser(user: {
    id: string;
    email?: string;
    username?: string;
    role?: string;
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  }

  /**
   * Очистка пользователя
   */
  static clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Добавление breadcrumb
   */
  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Установка тега
   */
  static setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  /**
   * Установка контекста
   */
  static setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }

  /**
   * Начало транзакции для мониторинга производительности
   */
  static startTransaction(name: string, operation: string) {
    return (Sentry as any).startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Логирование API ошибок
   */
  static logApiError(error: any, endpoint: string, method: string, statusCode?: number) {
    const context = {
      endpoint,
      method,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    this.setContext('api_error', context);
    this.addBreadcrumb(`API Error: ${method} ${endpoint}`, 'http', context);

    if (error instanceof Error) {
      this.logError(error, context);
    } else {
      this.logMessage(`API Error: ${method} ${endpoint} - ${statusCode}`, 'error', context);
    }
  }

  /**
   * Логирование ошибок авторизации
   */
  static logAuthError(error: Error, action: string, userId?: string) {
    const context = {
      action,
      userId,
      timestamp: new Date().toISOString(),
    };

    this.setContext('auth_error', context);
    this.addBreadcrumb(`Auth Error: ${action}`, 'auth', context);
    this.logError(error, context);
  }

  /**
   * Логирование ошибок навигации
   */
  static logNavigationError(error: Error, route: string, params?: any) {
    const context = {
      route,
      params,
      timestamp: new Date().toISOString(),
    };

    this.setContext('navigation_error', context);
    this.addBreadcrumb(`Navigation Error: ${route}`, 'navigation', context);
    this.logError(error, context);
  }

  /**
   * Логирование пользовательских действий
   */
  static logUserAction(action: string, data?: Record<string, any>) {
    this.addBreadcrumb(`User Action: ${action}`, 'user', data);
  }

  /**
   * Мониторинг производительности
   */
  static measurePerformance<T>(
    name: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const transaction = this.startTransaction(name, 'performance');

    try {
      const result = operation();

      if (result instanceof Promise) {
        return result
          .then((value) => {
            transaction.setStatus('ok');
            transaction.finish();
            return value;
          })
          .catch((error) => {
            transaction.setStatus('internal_error');
            transaction.finish();
            this.logError(error, { operation: name });
            throw error;
          });
      } else {
        transaction.setStatus('ok');
        transaction.finish();
        return Promise.resolve(result);
      }
    } catch (error) {
      transaction.setStatus('internal_error');
      transaction.finish();
      this.logError(error as Error, { operation: name });
      throw error;
    }
  }

  /**
   * Проверка здоровья приложения
   */
  static checkAppHealth() {
    const healthData = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      version: Constants.expoConfig?.version,
      // @ts-ignore - performance.memory is not standard but exists in some web environments
      memory: typeof performance !== 'undefined' && (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };

    this.setContext('app_health', healthData);
    this.addBreadcrumb('App Health Check', 'system', healthData);
  }
}

// Глобальный обработчик необработанных ошибок
export const setupGlobalErrorHandlers = () => {
  // Обработчик для необработанных Promise rejections
  const originalHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: any) => {
    // В React Native event может быть другим или отсутствовать reason напрямую
    const reason = event?.reason || event;

    ErrorMonitoringService.logError(
      new Error(`Unhandled Promise Rejection: ${reason}`),
      { type: 'unhandled_promise_rejection' }
    );

    if (originalHandler) {
      originalHandler(event);
    }
  };

  // Обработчик для необработанных ошибок
  const originalErrorHandler = global.onerror;
  global.onerror = (message, source, lineno, colno, error) => {
    ErrorMonitoringService.logError(
      error || new Error(String(message)),
      {
        type: 'unhandled_error',
        source,
        lineno,
        colno,
      }
    );

    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
};

// Экспорт для использования в компонентах
export default ErrorMonitoringService;