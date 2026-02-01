import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: number;
  order_title: string;
  client_name: string;
  agreed_price: string;
  status: ProjectStatus;
  deadline?: string;
  progress: number;
}

type ProjectStatus = 'new' | 'in_progress' | 'review' | 'completed';

const statusConfig: Record<ProjectStatus, { label: string; badge: string; color: string }> = {
  new: { label: 'To Do', badge: 'bg-[#0165FB]/10 text-[#0165FB]', color: '#0165FB' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-100 text-blue-600', color: '#2563EB' },
  review: { label: 'Review', badge: 'bg-orange-100 text-orange-600', color: '#EA580C' },
  completed: { label: 'Done', badge: 'bg-green-100 text-green-600', color: '#059669' },
};

export default function KanbanPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const projects: Project[] = [
    {
      id: 1,
      order_title: 'Ремонт ванной комнаты',
      client_name: 'Анна Петрова',
      agreed_price: '25000',
      status: 'in_progress',
      deadline: '2024-02-15',
      progress: 65
    },
    {
      id: 2,
      order_title: 'Установка кондиционера',
      client_name: 'Иван Сидоров',
      agreed_price: '15000',
      status: 'review',
      deadline: '2024-01-20',
      progress: 90
    },
    {
      id: 3,
      order_title: 'Покраска стен',
      client_name: 'Мария Козлова',
      agreed_price: '8000',
      status: 'new',
      deadline: '2024-01-25',
      progress: 0
    },
    {
      id: 4,
      order_title: 'Укладка плитки',
      client_name: 'Петр Иванов',
      agreed_price: '30000',
      status: 'completed',
      progress: 100
    }
  ];

  const handleStatusChange = async (projectId: number, newStatus: ProjectStatus) => {
    // TODO: Implement API call to update project status
    console.log('Update project status:', projectId, newStatus);
  };

  const filteredProjects = projects.filter(p => 
    p.order_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ProjectStatus[] = ['new', 'in_progress', 'review', 'completed'];
  const projectsByStatus = columns.reduce((acc, status) => {
    acc[status] = filteredProjects.filter(p => p.status === status);
    return acc;
  }, {} as Record<ProjectStatus, typeof projects>);

  const ProjectCard = ({ project }: { project: Project }) => {
    const [showMenu, setShowMenu] = useState(false);
    const daysUntilDeadline = project.deadline 
      ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
      : null;

    return (
      <View className="relative mb-3">
        <TouchableOpacity 
          onPress={() => router.push(`/master/projects/${project.id}`)}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <View className="flex-row items-start justify-between mb-2">
            <Text className="font-medium text-sm flex-1" numberOfLines={2}>
              {project.order_title}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMenu(!showMenu)}
              className="p-1"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-xs text-gray-500 mb-2">{project.client_name}</Text>
          
          {project.deadline && (
            <View className="flex-row items-center gap-1 mb-2">
              <Ionicons name="time" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500">
                {daysUntilDeadline !== null ? `${daysUntilDeadline}д` : ''}
              </Text>
            </View>
          )}
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-green-600">
              {project.agreed_price} сом
            </Text>
            <Text className="text-xs text-gray-400">{project.progress}%</Text>
          </View>
          
          {/* Progress bar */}
          <View className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <View 
              className="bg-[#0165FB] h-1 rounded-full" 
              style={{ width: `${project.progress}%` }}
            />
          </View>
        </TouchableOpacity>
        
        {showMenu && (
          <>
            <TouchableOpacity 
              className="absolute inset-0 z-40" 
              onPress={() => setShowMenu(false)} 
            />
            <View className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-xl z-50 py-2 border">
              {Object.entries(statusConfig).map(([status, config]) => (
                <TouchableOpacity 
                  key={status} 
                  onPress={() => { 
                    handleStatusChange(project.id, status as ProjectStatus);
                    setShowMenu(false);
                  }} 
                  className="px-4 py-2"
                >
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
              <Text className="text-xs text-gray-500">{projects.length} проектов</Text>
            </View>
          </View>
        </View>
        
        <View className="relative">
          <View style={{ position: 'absolute', left: 12, top: '50%', transform: [{ translateY: -8 }], zIndex: 1 }}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
          </View>
          <TextInput 
            placeholder="Поиск проектов..." 
            value={searchQuery} 
            onChangeText={setSearchQuery}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm"
          />
        </View>
      </View>

      {/* Kanban Board */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-1 p-4"
      >
        <View className="flex-row gap-4" style={{ minWidth: 1200 }}>
          {columns.map(status => (
            <View key={status} className="w-80">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-semibold text-sm text-gray-900">
                  {statusConfig[status].label}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${statusConfig[status].badge}`}>
                  <Text className="text-xs font-medium">
                    {projectsByStatus[status].length}
                  </Text>
                </View>
              </View>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                {projectsByStatus[status].map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}