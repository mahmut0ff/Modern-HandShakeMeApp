import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetProjectMilestonesQuery } from '../../services/projectApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import MilestoneProgress from '../../components/projects/MilestoneProgress';
import MilestonePaymentCard from '../../components/projects/MilestonePaymentCard';

interface ProjectMilestonesTabProps {
  projectId: number;
  canManage?: boolean;
}

export default function ProjectMilestonesTab({
  projectId,
  canManage = false,
}: ProjectMilestonesTabProps) {
  const { data: milestones, isLoading } = useGetProjectMilestonesQuery(projectId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!milestones || milestones.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="flag-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 text-center mt-4 mb-6">
          Вехи проекта не созданы
        </Text>
        {canManage && (
          <TouchableOpacity
            className="bg-blue-600 px-6 py-3 rounded-lg"
            onPress={() =>
              router.push({
                pathname: '/projects/milestones',
                params: { projectId },
              })
            }
          >
            <Text className="text-white font-semibold">Создать вехи</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const sortedMilestones = [...milestones].sort((a, b) => {
    return (a.orderNum || 0) - (b.orderNum || 0);
  });

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Progress */}
        <MilestoneProgress milestones={milestones} />

        {/* Milestones List */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold">Вехи проекта</Text>
            {canManage && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/projects/milestones',
                    params: { projectId },
                  })
                }
              >
                <Text className="text-blue-600 font-medium">Управление</Text>
              </TouchableOpacity>
            )}
          </View>

          {sortedMilestones.map((milestone) => (
            <MilestonePaymentCard key={milestone.id} milestone={milestone} />
          ))}
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 items-center"
          onPress={() =>
            router.push({
              pathname: '/projects/milestone-payment',
              params: { projectId },
            })
          }
        >
          <Text className="text-white font-semibold text-base">
            Просмотреть платежи
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
