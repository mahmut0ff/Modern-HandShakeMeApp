import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  MasterTrackingScreen,
  TrackingHistoryScreen,
  TrackingStatisticsScreen,
} from '../../../features/location-tracking';

type TabType = 'tracking' | 'history' | 'statistics';

export default function LocationTrackingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tracking');

  const renderContent = () => {
    switch (activeTab) {
      case 'tracking':
        return <MasterTrackingScreen onBack={() => router.back()} />;
      case 'history':
        return <TrackingHistoryScreen onBack={() => router.back()} />;
      case 'statistics':
        return <TrackingStatisticsScreen onBack={() => router.back()} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row px-4">
          <TouchableOpacity
            onPress={() => setActiveTab('tracking')}
            className={`flex-1 py-4 border-b-2 ${
              activeTab === 'tracking' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <View className="items-center">
              <Ionicons
                name="navigate"
                size={24}
                color={activeTab === 'tracking' ? '#0165FB' : '#9CA3AF'}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  activeTab === 'tracking' ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                Трекинг
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className={`flex-1 py-4 border-b-2 ${
              activeTab === 'history' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <View className="items-center">
              <Ionicons
                name="map"
                size={24}
                color={activeTab === 'history' ? '#0165FB' : '#9CA3AF'}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                История
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('statistics')}
            className={`flex-1 py-4 border-b-2 ${
              activeTab === 'statistics' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <View className="items-center">
              <Ionicons
                name="stats-chart"
                size={24}
                color={activeTab === 'statistics' ? '#0165FB' : '#9CA3AF'}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  activeTab === 'statistics' ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                Статистика
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">{renderContent()}</View>
    </SafeAreaView>
  );
}
