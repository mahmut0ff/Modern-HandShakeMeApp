import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Application {
  id: number;
  master: {
    id: number;
    name: string;
    avatar?: string;
    rating: string;
    completed_projects: number;
    is_verified: boolean;
  };
  proposed_price: string;
  proposed_duration_days: number;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function ApplicationsPage() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const applications: Application[] = [
    {
      id: 1,
      master: {
        id: 1,
        name: 'Иван Петров',
        avatar: undefined,
        rating: '4.8',
        completed_projects: 45,
        is_verified: true
      },
      proposed_price: '28000',
      proposed_duration_days: 7,
      cover_letter: 'Здравствуйте! Имею большой опыт в ремонте ванных комнат. Выполню работу качественно и в срок. Все материалы закуплю сам, предоставлю гарантию на работы.',
      status: 'pending',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      master: {
        id: 2,
        name: 'Алексей Сидоров',
        avatar: undefined,
        rating: '4.6',
        completed_projects: 32,
        is_verified: false
      },
      proposed_price: '25000',
      proposed_duration_days: 10,
      cover_letter: 'Добрый день! Профессионально занимаюсь ремонтом ванных комнат уже 5 лет. Могу предоставить примеры работ.',
      status: 'pending',
      created_at: '2024-01-15T09:15:00Z'
    },
    {
      id: 3,
      master: {
        id: 3,
        name: 'Мария Козлова',
        avatar: undefined,
        rating: '4.9',
        completed_projects: 67,
        is_verified: true
      },
      proposed_price: '32000',
      proposed_duration_days: 5,
      cover_letter: 'Здравствуйте! Специализируюсь на быстром и качественном ремонте. Работаю с командой профессионалов.',
      status: 'accepted',
      created_at: '2024-01-14T16:45:00Z'
    }
  ];

  const handleAcceptApplication = async (applicationId: number) => {
    Alert.alert(
      'Принять отклик',
      'Вы уверены, что хотите принять этот отклик? Остальные отклики будут автоматически отклонены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Успех', 'Отклик принят! Проект создан.');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось принять отклик');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectApplication = async (applicationId: number) => {
    Alert.alert(
      'Отклонить отклик',
      'Вы уверены, что хотите отклонить этот отклик?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось отклонить отклик');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return { style: 'bg-green-100 text-green-700', label: 'Принят' };
      case 'rejected':
        return { style: 'bg-red-100 text-red-700', label: 'Отклонён' };
      default:
        return { style: 'bg-orange-100 text-orange-700', label: 'Ожидает' };
    }
  };

  const renderApplication = ({ item }: { item: Application }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-3">
        {/* Master Info */}
        <View className="flex-row items-start gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.push(`/(client)/masters/${item.master.id}`)}
            className="relative"
          >
            <View className="w-16 h-16 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
              {item.master.avatar ? (
                <Image source={{ uri: item.master.avatar }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={32} color="white" />
              )}
            </View>
            {item.master.is_verified && (
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow">
                <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
              </View>
            )}
          </TouchableOpacity>
          
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push(`/(client)/masters/${item.master.id}`)}>
              <Text className="font-semibold text-gray-900">{item.master.name}</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-3 mt-1">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-sm font-medium">{item.master.rating}</Text>
              </View>
              <Text className="text-gray-300">•</Text>
              <Text className="text-sm text-gray-500">{item.master.completed_projects} проектов</Text>
            </View>
          </View>
          
          <View className={`px-3 py-1 rounded-full ${statusBadge.style}`}>
            <Text className="text-xs font-semibold">{statusBadge.label}</Text>
          </View>
        </View>

        {/* Proposal Details */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="card" size={16} color="#059669" />
              <Text className="font-bold text-green-600 text-lg">{item.proposed_price} сом</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar" size={16} color="#6B7280" />
              <Text className="text-gray-600">{item.proposed_duration_days} дней</Text>
            </View>
          </View>
        </View>

        {/* Cover Letter */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Сообщение:</Text>
          <Text className="text-gray-600 text-sm leading-5">{item.cover_letter}</Text>
        </View>

        {/* Actions */}
        {item.status === 'pending' && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleRejectApplication(item.id)}
              disabled={loading}
              className="flex-1 py-3 bg-red-50 border border-red-200 rounded-2xl"
            >
              <Text className="text-center font-medium text-red-600">Отклонить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAcceptApplication(item.id)}
              disabled={loading}
              className="flex-1 py-3 bg-[#0165FB] rounded-2xl shadow-lg"
            >
              <Text className="text-center font-medium text-white">
                {loading ? 'Обработка...' : 'Принять'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'accepted' && (
          <TouchableOpacity
            onPress={() => router.push('/(client)/projects')}
            className="py-3 bg-green-500 rounded-2xl shadow-lg"
          >
            <Text className="text-center font-medium text-white">Перейти к проекту</Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text className="text-xs text-gray-400 mt-3 text-center">
          Отправлен: {new Date(item.created_at).toLocaleString('ru-RU')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <View className="px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Отклики на заказ</Text>
            <Text className="text-sm text-gray-500">{applications.length} откликов</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="bg-[#0165FB] rounded-3xl p-5 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/70 text-sm">Всего откликов</Text>
              <Text className="text-3xl font-bold text-white">{applications.length}</Text>
            </View>
            <View className="flex-row gap-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">
                  {applications.filter(a => a.status === 'pending').length}
                </Text>
                <Text className="text-xs text-white/70">Ожидают</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">
                  {applications.filter(a => a.status === 'accepted').length}
                </Text>
                <Text className="text-xs text-white/70">Приняты</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Applications List */}
      <View className="flex-1 px-4">
        {applications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-[#0165FB]/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="people" size={40} color="#0165FB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Нет откликов</Text>
            <Text className="text-gray-500 text-center">
              Пока никто не откликнулся на ваш заказ
            </Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplication}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}