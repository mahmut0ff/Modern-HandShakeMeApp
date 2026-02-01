/**
 * Global Error Handler Service
 * Handles network errors, API errors, and other application errors
 */

import { Alert } from 'react-native';
import { logout } from '../features/auth/authSlice';

// Type for the store dispatch to avoid circular dependency
type AppDispatch = any;

export interface AppError {
  type: 'network' | 'api' | 'auth' | 'validation' | 'unknown';
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
}

class ErrorHandlerService {
  private errorQueue: AppError[] = [];
  private isShowingError = false;
  private dispatch: AppDispatch | null = null;

  // Injection method to avoid circular dependencies
  setDispatch(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  // FIXED: Global network error handler
  handleNetworkError(error: any): AppError {
    const appError: AppError = {
      type: 'network',
      message: 'Проблема с подключением к интернету',
      details: error,
      timestamp: new Date(),
    };

    // Check if it's a timeout
    if (error.message?.includes('timeout')) {
      appError.message = 'Превышено время ожидания. Проверьте подключение к интернету.';
    }

    // Check if it's a connection refused
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch')) {
      appError.message = 'Не удается подключиться к серверу. Попробуйте позже.';
    }

    this.logError(appError);
    this.showErrorToUser(appError);
    return appError;
  }

  // FIXED: API error handler with proper status code handling
  handleAPIError(error: any, endpoint?: string): AppError {
    let appError: AppError = {
      type: 'api',
      message: 'Произошла ошибка на сервере',
      timestamp: new Date(),
    };

    if (error.status) {
      appError.code = error.status;

      switch (error.status) {
        case 400:
          appError.type = 'validation';
          appError.message = 'Неверные данные запроса';
          break;
        case 401:
          appError.type = 'auth';
          appError.message = 'Необходима авторизация';
          this.handleAuthError();
          break;
        case 403:
          appError.type = 'auth';
          appError.message = 'Недостаточно прав доступа';
          break;
        case 404:
          appError.message = 'Запрашиваемый ресурс не найден';
          break;
        case 422:
          appError.type = 'validation';
          appError.message = 'Ошибка валидации данных';
          break;
        case 429:
          appError.message = 'Слишком много запросов. Попробуйте позже.';
          break;
        case 500:
          appError.message = 'Внутренняя ошибка сервера';
          break;
        case 502:
        case 503:
        case 504:
          appError.message = 'Сервер временно недоступен';
          break;
        default:
          appError.message = `Ошибка сервера (${error.status})`;
      }
    }

    // Extract error message from response
    if (error.data?.message) {
      appError.message = error.data.message;
    } else if (error.data?.error?.message) {
      appError.message = error.data.error.message;
    }

    appError.details = { endpoint, ...error };

    this.logError(appError);

    // Don't show auth errors to user (handled separately)
    if (appError.type !== 'auth') {
      this.showErrorToUser(appError);
    }

    return appError;
  }

  // FIXED: Authentication error handler
  private handleAuthError() {
    console.log('Authentication error - logging out user');
    if (this.dispatch) {
      this.dispatch(logout());
    } else {
      console.warn('Dispatch not initialized in ErrorHandlerService');
    }

    // Don't show multiple auth error alerts
    if (!this.isShowingError) {
      this.isShowingError = true;
      Alert.alert(
        'Сессия истекла',
        'Пожалуйста, войдите в систему заново',
        [
          {
            text: 'OK',
            onPress: () => {
              this.isShowingError = false;
            }
          }
        ]
      );
    }
  }

  // FIXED: Validation error handler
  handleValidationError(errors: Record<string, string[]>): AppError {
    const firstError = Object.values(errors)[0]?.[0] || 'Ошибка валидации';

    const appError: AppError = {
      type: 'validation',
      message: firstError,
      details: errors,
      timestamp: new Date(),
    };

    this.logError(appError);
    this.showErrorToUser(appError);
    return appError;
  }

  // FIXED: Generic error handler
  handleUnknownError(error: any, context?: string): AppError {
    const appError: AppError = {
      type: 'unknown',
      message: 'Произошла неожиданная ошибка',
      details: { error, context },
      timestamp: new Date(),
    };

    // Try to extract meaningful message
    if (error.message) {
      appError.message = error.message;
    }

    this.logError(appError);
    this.showErrorToUser(appError);
    return appError;
  }

  // FIXED: Error logging (can be extended to send to crash reporting service)
  private logError(error: AppError) {
    console.error('App Error:', {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      details: error.details,
    });

    // Add to error queue for potential batch sending
    this.errorQueue.push(error);

    // Keep only last 50 errors
    if (this.errorQueue.length > 50) {
      this.errorQueue = this.errorQueue.slice(-50);
    }

    // TODO: Send to crash reporting service (Sentry, Crashlytics, etc.)
    // this.sendToCrashReporting(error);
  }

  // FIXED: Show error to user with rate limiting
  private showErrorToUser(error: AppError) {
    // Don't show too many errors at once
    if (this.isShowingError) {
      return;
    }

    // Don't show network errors too frequently
    if (error.type === 'network') {
      const recentNetworkErrors = this.errorQueue.filter(
        e => e.type === 'network' &&
          Date.now() - e.timestamp.getTime() < 30000 // Last 30 seconds
      );

      if (recentNetworkErrors.length > 2) {
        return; // Skip showing this error
      }
    }

    this.isShowingError = true;

    Alert.alert(
      this.getErrorTitle(error.type),
      error.message,
      [
        {
          text: 'OK',
          onPress: () => {
            this.isShowingError = false;
          }
        }
      ]
    );
  }

  private getErrorTitle(type: AppError['type']): string {
    switch (type) {
      case 'network': return 'Проблема с сетью';
      case 'api': return 'Ошибка сервера';
      case 'auth': return 'Ошибка авторизации';
      case 'validation': return 'Ошибка данных';
      default: return 'Ошибка';
    }
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const last24h = this.errorQueue.filter(e => now - e.timestamp.getTime() < 24 * 60 * 60 * 1000);

    return {
      total: this.errorQueue.length,
      last24h: last24h.length,
      byType: this.errorQueue.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Clear error queue
  clearErrors() {
    this.errorQueue = [];
  }
}

export const errorHandler = new ErrorHandlerService();

// React Native global error handling is managed by errorMonitoring.ts
// which uses global.onunhandledrejection and global.onerror