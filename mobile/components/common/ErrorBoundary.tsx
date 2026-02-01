import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Here you could send error to crash reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportBug = () => {
    // Here you could open a bug report form or email
    console.log('Bug report requested');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-[#F8F7FC]">
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 40 }}>
            <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100">
              {/* Error Icon */}
              <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="alert-circle" size={40} color="#EF4444" />
              </View>

              {/* Error Title */}
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                Что-то пошло не так
              </Text>

              {/* Error Description */}
              <Text className="text-gray-500 text-center mb-6 leading-6">
                Произошла неожиданная ошибка. Мы уже работаем над её исправлением.
              </Text>

              {/* Action Buttons */}
              <View className="w-full flex flex-col gap-3">
                <TouchableOpacity
                  onPress={this.handleRetry}
                  className="bg-[#0165FB] py-4 px-6 rounded-2xl items-center"
                >
                  <Text className="text-white font-semibold text-lg">
                    Попробовать снова
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={this.handleReportBug}
                  className="bg-gray-100 py-4 px-6 rounded-2xl items-center"
                >
                  <Text className="text-gray-700 font-medium text-lg">
                    Сообщить об ошибке
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Details (Development only) */}
              {__DEV__ && this.state.error && (
                <View className="w-full mt-8 p-4 bg-gray-50 rounded-2xl">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Детали ошибки (только для разработки):
                  </Text>
                  <ScrollView className="max-h-40">
                    <Text className="text-xs text-gray-600 font-mono">
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <Text className="text-xs text-gray-600 font-mono mt-2">
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;