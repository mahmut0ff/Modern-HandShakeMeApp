/**
 * ErrorBoundary Component
 * Catches and handles React errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      // Default fallback UI
      return (
        <View className="flex-1 bg-[#F8F7FC] items-center justify-center px-6">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Что-то пошло не так
          </Text>

          <Text className="text-base text-gray-600 text-center mb-8 leading-relaxed">
            Произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView className="w-full max-h-48 bg-gray-100 rounded-2xl p-4 mb-6">
              <Text className="text-xs font-mono text-red-600 mb-2">
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text className="text-xs font-mono text-gray-600">
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={this.resetError}
            className="bg-[#0165FB] px-8 py-4 rounded-2xl shadow-lg"
            activeOpacity={0.8}
            style={{
              shadowColor: '#0165FB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white font-semibold text-lg">
              Попробовать снова
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              onPress={() => {
                // Reload the app in development
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="mt-4 px-6 py-3"
            >
              <Text className="text-gray-500 text-sm">
                Перезагрузить приложение (Dev)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
