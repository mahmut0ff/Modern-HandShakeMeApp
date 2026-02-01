import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: number;
  order_title: string;
  client: {
    id: number;
    name: string;
    avatar?: string;
    phone: string;
  };
  agreed_price: string;
  status: 'new' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  progress: number;
  deadline?: string;
  start_date?: string;
  completed_at?: string;
  description: string;
  milestones: Milestone[];
  files: ProjectFile[];
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  completed_at?: string;
}

interface ProjectFile {
  id: number;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  uploaded_by: 'client' | 'master';
  created_at: string;
}

const statusLabels: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MasterProjectDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const project: Project = {
    id: Number(id),
    order_title: 'Ремонт ванной комнаты',
    client: {
      id: 1,
      name: 'Анна Сидорова',
      avatar: undefined,
      phone: '+996700123456'
    },
    agreed_price: '28000',
    status: 'in_progress',
    progress: 65,
    deadline: '2024-02-15',
    start_date: '2024-02-01',
    description: 'Полный ремонт ванной комнаты площадью 6 кв.м с заменой сантехники и плитки.',
    milestones: [
      {
        id: 1,
        title: 'Демонтаж старой плитки',
        description: 'Снос старой плитки и подготовка поверхности',
        is_completed: true,
        completed_at: '2024-02-02T10:00:00Z'
      },
      {
        id: 2,
        title: 'Выравнивание стен',
        description: 'Штукатурка и выравнивание стен под плитку',
        is_completed: true,
        completed_at: '2024-02-05T16:00:00Z'
      },
      {
        id: 3,
        title: 'Укладка плитки',
        description: 'Укладка новой плитки на стены и пол',
        is_completed: false
      },
      {
        id: 4,
        title: 'Установка сантехники',
        description: 'Установка новой сантехники и подключение',
        is_completed: false
      }
    ],
    files: [
      {
        id: 1,
        file_url: 'https://example.com/progress1.jpg',
        file_type: 'image',
        uploaded_by: 'master',
        created_at: '2024-02-02T10:30:00Z'
      },
      {
        id: 2,
        file_url: 'https://example.com/progress2.jpg',
        file_type: 'image',
        uploaded_by: 'master',
        created_at: '2024-02-05T16:30:00Z'
      }
    ]
  };

  const handleStartChat = () => {
    // Navigate to chat list - actual chat room should be created/found via API
    router.push(`/(master)/chat`);
  };

  const handleRequestPayment = async () => {
    Alert.alert(
      'Запросить оплату',
      'Вы уверены, что хотите запросить оплату за выполненную работу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Запросить',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Успех', 'Запрос на оплату отправлен клиенту!');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось отправить запрос на оплату');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteProject = async () => {
    Alert.alert(
      'Завершить проект',
      'Вы уверены, что работа полностью выполнена?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement API call
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Успех', 'Проект завершён!');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось завершить проект');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const completedMilestones = project.milestones.filter(m => m.is_completed).length;
  const totalMilestones = project.milestones.length;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {project.order_title}
            </Text>
            <View className={`self-start px-3 py-1 rounded-full mt-1 ${statusColors[project.status]}`}>
              <Text className="text-xs font-semibold">{statusLabels[project.status]}</Text>
            </View>
          </View>
        </View>

        {/* Project Info Card */}
        <View className="bg-[#0165FB] rounded-3xl p-5 text-white shadow-lg mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/70 text-sm">Стоимость проекта</Text>
              <Text className="text-3xl font-bold text-white">{project.agreed_price} сом</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-white">{project.progress}%</Text>
              <Text className="text-xs text-white/70">Выполнено</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View className="w-full bg-white/20 rounded-full h-2 mb-2">
            <View 
              className="bg-white h-2 rounded-full" 
              style={{ width: `${project.progress}%` }}
            />
          </View>
          
          {project.deadline && (
            <Text className="text-white/70 text-sm">
              Дедлайн: {new Date(project.deadline).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </View>

        {/* Client Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="person" size={20} color="#0165FB" />
            <Text className="font-semibold text-gray-900">Клиент</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.push(`/(master)/clients/${project.client.id}`)}
              className="w-16 h-16 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden"
            >
              {project.client.avatar ? (
                <Image source={{ uri: project.client.avatar }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={32} color="white" />
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <TouchableOpacity onPress={() => router.push(`/(master)/clients/${project.client.id}`)}>
                <Text className="font-semibold text-gray-900">{project.client.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {/* TODO: Make phone call */}}
                className="flex-row items-center gap-1 mt-1"
              >
                <Ionicons name="call" size={16} color="#0165FB" />
                <Text className="text-[#0165FB] font-medium">{project.client.phone}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleStartChat}
              className="w-12 h-12 bg-[#0165FB] rounded-2xl items-center justify-center"
            >
              <Ionicons name="chatbubble" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="document-text" size={20} color="#0165FB" />
            <Text className="font-semibold text-gray-900">Описание проекта</Text>
          </View>
          <Text className="text-gray-600">{project.description}</Text>
        </View>

        {/* Milestones */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#0165FB" />
              <Text className="font-semibold text-gray-900">Этапы работы</Text>
            </View>
            <Text className="text-sm text-gray-500">
              {completedMilestones} из {totalMilestones}
            </Text>
          </View>
          
          <View className="flex flex-col gap-3">
            {project.milestones.map((milestone, index) => (
              <View key={milestone.id} className="flex-row items-start gap-3">
                <View className={`w-6 h-6 rounded-full items-center justify-center mt-0.5 ${
                  milestone.is_completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {milestone.is_completed ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-medium ${
                    milestone.is_completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {milestone.title}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">{milestone.description}</Text>
                  {milestone.completed_at && (
                    <Text className="text-xs text-green-600 mt-1">
                      Завершено: {new Date(milestone.completed_at).toLocaleDateString('ru-RU')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Project Files */}
        {project.files.length > 0 && (
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="image" size={20} color="#0165FB" />
              <Text className="font-semibold text-gray-900">Фото прогресса ({project.files.length})</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {project.files.map(file => (
                <TouchableOpacity
                  key={file.id}
                  className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 relative"
                >
                  {file.file_type === 'image' ? (
                    <Image source={{ uri: file.file_url }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="document" size={32} color="#9CA3AF" />
                    </View>
                  )}
                  <View className={`absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center ${
                    file.uploaded_by === 'master' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <Ionicons 
                      name={file.uploaded_by === 'master' ? 'build' : 'person'} 
                      size={12} 
                      color="white" 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="flex flex-col gap-3 mb-6">
          {project.status === 'in_progress' && (
            <>
              <TouchableOpacity
                onPress={handleRequestPayment}
                disabled={loading}
                className={`py-4 rounded-2xl shadow-lg mb-3 ${
                  loading ? 'bg-gray-400' : 'bg-orange-500'
                }`}
              >
                <Text className="text-center font-semibold text-white text-lg">
                  {loading ? 'Обработка...' : 'Запросить оплату'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCompleteProject}
                disabled={loading}
                className={`py-4 rounded-2xl shadow-lg mb-3 ${
                  loading ? 'bg-gray-400' : 'bg-green-500'
                }`}
              >
                <Text className="text-center font-semibold text-white text-lg">
                  {loading ? 'Обработка...' : 'Завершить проект'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            onPress={handleStartChat}
            className="py-4 bg-white border border-gray-200 rounded-2xl shadow-sm"
          >
            <Text className="text-center font-semibold text-[#0165FB] text-lg">
              Написать клиенту
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}