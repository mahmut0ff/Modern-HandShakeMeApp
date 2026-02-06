import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  useGetProjectQuery, 
  useCompleteProjectMutation,
  useUpdateProjectMutation 
} from '../../../services/projectApi';
import { useSendPaymentMutation } from '../../../services/walletApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

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

  // API hooks
  const { data: project, isLoading: projectLoading, error: projectError } = useGetProjectQuery(Number(id));
  const [completeProject] = useCompleteProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [sendPayment] = useSendPaymentMutation();

  const handleStartChat = () => {
    router.push(`/(master)/chat`);
  };

  const handleCallClient = () => {
    const phone = project?.client?.phone || project?.client_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Ошибка', 'Номер телефона недоступен');
    }
  };

  const handleRequestPayment = async () => {
    if (!project) return;
    
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
              await sendPayment({
                recipient_id: project.client?.id || 0,
                amount: parseFloat(project.agreed_price),
                description: `Оплата за проект: ${project.order?.title || project.order_title}`,
                project_id: project.id,
              }).unwrap();
              Alert.alert('Успех', 'Запрос на оплату отправлен клиенту!');
            } catch (error: any) {
              console.error('Request payment error:', error);
              Alert.alert('Ошибка', error.data?.message || 'Не удалось отправить запрос на оплату');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteProject = async () => {
    if (!project) return;
    
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
              await completeProject({ id: project.id }).unwrap();
              Alert.alert('Успех', 'Проект завершён!');
            } catch (error: any) {
              console.error('Complete project error:', error);
              Alert.alert('Ошибка', error.data?.message || 'Не удалось завершить проект');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (projectLoading) {
    return <LoadingSpinner fullScreen text="Загрузка проекта..." />;
  }

  if (projectError || !project) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC] items-center justify-center px-4">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-gray-900 font-semibold mt-4">Проект не найден</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-3 bg-[#0165FB] rounded-xl">
          <Text className="text-white font-semibold">Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const completedMilestones = project.milestones?.filter(m => m.status === 'COMPLETED').length || 0;
  const totalMilestones = project.milestones?.length || 0;
  const clientName = project.client?.name || project.client_name || 'Клиент';
  const clientAvatar = project.client?.avatar || project.client_avatar;
  const clientPhone = project.client?.phone || project.client_phone;
  const orderTitle = project.order?.title || project.order_title || 'Проект';

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
              {orderTitle}
            </Text>
            <View className={`self-start px-3 py-1 rounded-full mt-1 ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
              <Text className="text-xs font-semibold">{statusLabels[project.status] || project.status}</Text>
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
              onPress={() => router.push(`/(master)/clients/${project.client?.id || project.client_id}`)}
              className="w-16 h-16 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden"
            >
              {clientAvatar ? (
                <Image source={{ uri: clientAvatar }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={32} color="white" />
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <TouchableOpacity onPress={() => router.push(`/(master)/clients/${project.client?.id || project.client_id}`)}>
                <Text className="font-semibold text-gray-900">{clientName}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCallClient}
                className="flex-row items-center gap-1 mt-1"
              >
                <Ionicons name="call" size={16} color="#0165FB" />
                <Text className="text-[#0165FB] font-medium">{clientPhone || 'Нет номера'}</Text>
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
        {project.milestones && project.milestones.length > 0 && (
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
              {project.milestones.map((milestone, index) => {
                const isCompleted = milestone.status === 'COMPLETED' || milestone.is_completed;
                return (
                  <View key={milestone.id} className="flex-row items-start gap-3">
                    <View className={`w-6 h-6 rounded-full items-center justify-center mt-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Text className="text-white text-xs font-bold">{index + 1}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {milestone.title}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">{milestone.description}</Text>
                      {(milestone.completedAt || milestone.completed_at) && (
                        <Text className="text-xs text-green-600 mt-1">
                          Завершено: {new Date(milestone.completedAt || milestone.completed_at!).toLocaleDateString('ru-RU')}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Project Files */}
        {project.files && project.files.length > 0 && (
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
                  {(file.file_type === 'photo') ? (
                    <Image source={{ uri: file.file_url || file.file }} className="w-full h-full" />
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