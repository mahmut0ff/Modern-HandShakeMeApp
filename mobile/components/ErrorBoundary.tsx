/**
 * Enhanced ErrorBoundary Component
 * Catches and handles React errors gracefully with proper error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorMonitoringService from '../services/errorMonitoring';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    // Log to Sentry
    ErrorMonitoringService.logError(error, {
      componentStack: errorInfo.componentStack,
      type: 'react_error_boundary'
    });
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    ErrorMonitoringService.addBreadcrumb('Error Boundary Reset', 'user');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      // Default fallback UI
      return (
        <View 
          className="flex-1 bg-[#F8F7FC] items-center justify-center p-6"
          accessibilityLabel="Error occurred"
          accessibilityRole="alert"
        >
          <View className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 max-w-sm w-full">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                Что-то пошло не так
              </Text>
              <Text className="text-gray-600 text-center">
                Произошла неожиданная ошибка. Мы уже работаем над её исправлением.
              </Text>
            </View>

            <TouchableOpacity
              onPress={this.resetError}
              className="bg-[#0165FB] py-3 px-6 rounded-2xl mb-3"
              accessibilityLabel="Retry loading"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold text-center">
                Попробовать снова
              </Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView className="max-h-32 bg-gray-50 rounded-2xl p-3 mt-3">
                <Text className="text-xs text-gray-700 font-mono">
                  {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text className="text-xs text-gray-500 font-mono mt-2">
                    {this.state.error.stack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
