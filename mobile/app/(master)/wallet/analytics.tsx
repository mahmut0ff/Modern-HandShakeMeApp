import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WalletAnalyticsPage() {
  const [period, setPeriod] = useState('month');

  const periods = [
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'quarter', label: 'Квартал' },
    { key: 'year', label: 'Год' },
  ];

  // Mock data - replace with actual API calls
  const analytics = {
    totalEarnings: 125000,
    totalWithdrawals: 45000,
    totalCommissions: 6250,
    netIncome: 73750,
    averageProjectValue: 15625,
    completedProjects: 8,
    pendingPayments: 25000,
    
    monthlyData: [
      { month: 'Янв', earnings: 18000, withdrawals: 5000 },
      { month: 'Фев', earnings: 22000, withdrawals: 8000 },
      { month: 'Мар', earnings: 28000, withdrawals: 12000 },
      { month: 'Апр', earnings: 31000, withdrawals: 10000 },
      { month: 'Май', earnings: 26000, withdrawals: 10000 },
    ],
    
    categoryBreakdown: [
      { category: 'Сантехника', amount: 45000, percentage: 36 },
      { category: 'Электрика', amount: 35000, percentage: 28 },
      { category: 'Ремонт', amount: 25000, percentage: 20 },
      { category: 'Отделка', amount: 20000, percentage: 16 },
    ]
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Аналитика доходов</Text>
        </View>

        {/* Period Filter */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Период</Text>
          <View className="flex-row gap-2">
            {periods.map(p => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriod(p.key)}
                className={`flex-1 py-3 rounded-2xl ${
                  period === p.key ? 'bg-[#0165FB]' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-center font-medium ${
                  period === p.key ? 'text-white' : 'text-gray-700'
                }`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Stats */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Основные показатели</Text>
          
          <View className="space-y-4">
            <View className="flex-row items-center justify-between p-3 bg-green-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-500 rounded-xl items-center justify-center">
                  <Ionicons name="trending-up" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Общий доход</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {analytics.totalEarnings.toLocaleString()} сом
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-3 bg-blue-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-500 rounded-xl items-center justify-center">
                  <Ionicons name="wallet" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Чистый доход</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {analytics.netIncome.toLocaleString()} сом
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-3 bg-purple-50 rounded-2xl">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-500 rounded-xl items-center justify-center">
                  <Ionicons name="bar-chart" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-sm text-gray-600">Средний чек</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {analytics.averageProjectValue.toLocaleString()} сом
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Stats */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Детальная статистика</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Выводы</Text>
              <Text className="font-semibold text-red-600">
                -{analytics.totalWithdrawals.toLocaleString()} сом
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Комиссии</Text>
              <Text className="font-semibold text-yellow-600">
                -{analytics.totalCommissions.toLocaleString()} сом
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Завершено проектов</Text>
              <Text className="font-semibold text-gray-900">
                {analytics.completedProjects}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Ожидают оплаты</Text>
              <Text className="font-semibold text-orange-600">
                {analytics.pendingPayments.toLocaleString()} сом
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Доходы по категориям</Text>
          
          <View className="space-y-3">
            {analytics.categoryBreakdown.map((item, index) => (
              <View key={index} className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700 font-medium">{item.category}</Text>
                  <Text className="font-semibold text-gray-900">
                    {item.amount.toLocaleString()} сом ({item.percentage}%)
                  </Text>
                </View>
                <View className="w-full bg-gray-200 rounded-full h-2">
                  <View 
                    className="bg-[#0165FB] h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Chart Placeholder */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Динамика по месяцам</Text>
          
          <View className="h-48 bg-gray-50 rounded-2xl items-center justify-center">
            <Ionicons name="bar-chart" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">График доходов</Text>
            <Text className="text-sm text-gray-400">Будет добавлен в следующем обновлении</Text>
          </View>
        </View>

        {/* Export */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-4">Экспорт данных</Text>
          
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 py-3 bg-gray-100 rounded-2xl">
              <Text className="text-center font-medium text-gray-700">Скачать PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 py-3 bg-[#0165FB] rounded-2xl">
              <Text className="text-center font-medium text-white">Отправить на email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}