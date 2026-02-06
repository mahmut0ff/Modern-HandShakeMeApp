import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetMyProjectsQuery, useUpdateProjectMutation } from '../../services/projectApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

const statusConfig: Record<ProjectStatus, { label: string; badge: string; color: string }> = {
  pending: { label: 'To Do', badge: 'bg-[#0165FB]/10 text-[#0165FB]', color: '#0165FB' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-100 text-blue-600', color: '#2563EB' },
  completed: { label: 'Done', badge: 'bg-green-100 text-green-600', color: '#059669' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-600', color: '#DC2626' },
};

export default function KanbanPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading, error, refetch } = useGetMyProjectsQuery({ role: 'master' });
  const [updateProject] = useUpdateProjectMutation();

  const handleStatusChange = async (projectId: number, newStatus: ProjectStatus) => {
    try {
      await updateProject({
        id: projectId,
        data: { status: newStatus }
      }).unwrap();
      refetch();
    } catch (err: any) {
      console.error('Update project status error:', err);
      Alert.alert('Ошибка', err.data?.message || 'Не удалось обновить статус');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка проектов..." />;
  }

  const projectList = projects || [];
  const filteredProjects = projectList.filter(p => {
    const title = p.order?.title || p.order_title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const columns: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
  const projectsByStatus = columns.reduce((acc, status) => {
    acc[status] = filteredProjects.filter(p => p.status === status);
    return acc;
  }, {} as Record<ProjectStatus, typeof projectList>);

  const ProjectCard = ({ project }: { project: typeof projectList[0] }) => {
    const [showMenu, setShowMenu] = useState(false);
    const orderTitle = project.order?.title || project.order_title || 'Проект';
    const clientName = project.client?.name || project.client_name || 'Клиент';
    const deadline = project.end_date || project.deadline;
    const daysUntilDeadline = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <View className="relative mb-3">
        <TouchableOpacity onPress={() => router.push(`/(master)/projects/${project.id}`)} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="font-medium text-sm flex-1" numberOfLines={2}>{orderTitle}</Text>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)} className="p-1">
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-500 mb-2">{clientName}</Text>
          {deadline && (
            <View className="flex-row items-center gap-1 mb-2">
              <Ionicons name="time" size={12} color="#6B7280" />
              <Text className={`text-xs ${daysUntilDeadline !== null && daysUntilDeadline < 3 ? 'text-red-500' : 'text-gray-500'}`}>
                {daysUntilDeadline !== null ? (daysUntilDeadline > 0 ? `${daysUntilDeadline}д` : 'Просрочен') : ''}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-green-600">{project.agreed_price} сом</Text>
            <Text className="text-xs text-gray-400">{project.progress}%</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <View className="bg-[#0165FB] h-1 rounded-full" style={{ width: `${project.progress}%` }} />
          </View>
        </TouchableOpacity>
        
        {showMenu && (
          <>
            <TouchableOpacity className="absolute inset-0 z-40" onPress={() => setShowMenu(false)} />
            <View className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-xl z-50 py-2 border">
              {Object.entries(statusConfig).map(([status, config]) => (
                <TouchableOpacity key={status} onPress={() => { handleStatusChange(project.id, status as ProjectStatus); setShowMenu(false); }} className="px-4 py-2">
                  <Text className="text-sm text-gray-700">{config.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };


  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-cyan-500 rounded-xl items-center justify-center">
              <Ionicons name="grid" size={20} color="white" />
            </View>
            <View>
              <Text className="text-lg font-semibold text-gray-900">Kanban Board</Text>
              <Text className="text-xs text-gray-500">{projectList.length} проектов</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => refetch()} className="p-2">
            <Ionicons name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <View className="relative">
          <View style={{ position: 'absolute', left: 12, top: '50%', transform: [{ translateY: -8 }], zIndex: 1 }}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
          </View>
          <TextInput placeholder="Поиск проектов..." value={searchQuery} onChangeText={setSearchQuery} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm" />
        </View>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-gray-600 mt-2">Ошибка загрузки проектов</Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 px-6 py-2 bg-[#0165FB] rounded-xl">
            <Text className="text-white font-medium">Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : projectList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-600 mt-4 text-center">У вас пока нет проектов</Text>
          <TouchableOpacity onPress={() => router.push('/(master)/orders')} className="mt-4 px-6 py-3 bg-[#0165FB] rounded-xl">
            <Text className="text-white font-semibold">Найти заказы</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 p-4">
          <View className="flex-row gap-4" style={{ minWidth: 1200 }}>
            {columns.map(status => (
              <View key={status} className="w-80">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-semibold text-sm text-gray-900">{statusConfig[status].label}</Text>
                  <View className={`px-2 py-0.5 rounded-full ${statusConfig[status].badge}`}>
                    <Text className="text-xs font-medium">{projectsByStatus[status].length}</Text>
                  </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {projectsByStatus[status].map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {projectsByStatus[status].length === 0 && (
                    <View className="py-8 items-center">
                      <Text className="text-gray-400 text-sm">Нет проектов</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
