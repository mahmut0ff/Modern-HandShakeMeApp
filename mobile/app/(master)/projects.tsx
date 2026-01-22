import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { 
  useGetMyProjectsQuery,
  type Project 
} from '../../services/projectApi'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatRelativeTime } from '../../utils/format'

export default function MasterProjectsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  // API queries
  const { 
    data: allProjects = [], 
    isLoading, 
    error,
    refetch 
  } = useGetMyProjectsQuery({ 
    role: 'master',
    ordering: '-created_at'
  });

  const activeProjects = allProjects.filter(p => 
    p.status === 'in_progress' || p.status === 'pending'
  );
  const completedProjects = allProjects.filter(p => 
    p.status === 'completed'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'review':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const currentProjects = activeTab === 'active' ? activeProjects : completedProjects;

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка проектов..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Не удалось загрузить проекты"
        onRetry={refetch}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Мои проекты</Text>
        
        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-xl ${
              activeTab === 'active' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'active' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              Активные ({activeProjects.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded-xl ${
              activeTab === 'completed' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'completed' ? 'text-gray-900' : 'text-gray-600'
            }`}>
              Завершённые ({completedProjects.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Projects List */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {currentProjects.length === 0 ? (
          <View className="items-center py-12">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="folder-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 text-lg font-medium mb-2">
              {activeTab === 'active' ? 'Нет активных проектов' : 'Нет завершённых проектов'}
            </Text>
            <Text className="text-gray-400 text-center">
              {activeTab === 'active' 
                ? 'Откликайтесь на заказы, чтобы получить проекты'
                : 'Завершённые проекты появятся здесь'
              }
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {currentProjects.map(project => (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push(`/(master)/projects/${project.id}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {project.order_title || project.order?.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {project.client_name || project.client?.name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-blue-600">{project.agreed_price} сом</Text>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      <Text className="text-xs font-semibold">
                        {project.status_display || project.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Description */}
                <Text className="text-sm text-gray-600 mb-4" numberOfLines={2}>
                  {project.description || project.order?.description}
                </Text>
                
                {/* Progress Bar (for active projects) */}
                {activeTab === 'active' && (
                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-gray-700">Прогресс</Text>
                      <Text className="text-sm font-bold text-blue-600">{project.progress}%</Text>
                    </View>
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </View>
                  </View>
                )}
                
                {/* Rating (for completed projects) */}
                {activeTab === 'completed' && project.status === 'completed' && (
                  <View className="mb-4 p-3 bg-gray-50 rounded-2xl">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Text className="text-sm font-medium text-gray-700">Оценка:</Text>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name="star"
                            size={16}
                            color={star <= 5 ? '#F59E0B' : '#E5E7EB'}
                          />
                        ))}
                      </View>
                      <Text className="text-sm font-bold text-gray-900">(5/5)</Text>
                    </View>
                    <Text className="text-sm text-gray-600 italic">
                      "Отличная работа! Всё сделано качественно и в срок."
                    </Text>
                  </View>
                )}
                
                {/* Dates */}
                <View className="flex-row items-center justify-between text-xs text-gray-500">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500">
                      Начат: {formatRelativeTime(project.start_date)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500">
                      {project.status === 'completed' && project.completed_at
                        ? `Завершён: ${formatRelativeTime(project.completed_at)}`
                        : project.end_date
                        ? `Дедлайн: ${formatRelativeTime(project.end_date)}`
                        : 'Без дедлайна'
                      }
                    </Text>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity 
                    onPress={() => router.push(`/(master)/chat/${project.id}`)}
                    className="flex-1 bg-gray-100 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="chatbubble" size={16} color="#6B7280" />
                    <Text className="text-gray-700 font-medium">Написать</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => router.push(`/(master)/projects/${project.id}`)}
                    className="flex-1 bg-blue-500 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="eye" size={16} color="white" />
                    <Text className="text-white font-medium">Подробнее</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}