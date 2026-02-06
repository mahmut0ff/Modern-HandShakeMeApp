/**
 * Profile Skills List Component
 * Список навыков и категорий мастера
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Skill {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProfileSkillsListProps {
  categories?: Category[];
  skills?: Skill[];
  editable?: boolean;
  onEditPress?: () => void;
}

export function ProfileSkillsList({
  categories,
  skills,
  editable = false,
  onEditPress,
}: ProfileSkillsListProps) {
  const hasContent = (categories && categories.length > 0) || (skills && skills.length > 0);

  if (!hasContent && !editable) {
    return null;
  }

  return (
    <View className="bg-white p-4 border-t border-gray-200">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-gray-900">
          Специализация
        </Text>
        {editable && (
          <TouchableOpacity onPress={onEditPress}>
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {!hasContent && editable && (
        <TouchableOpacity
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center"
          onPress={onEditPress}
        >
          <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">Добавить специализацию</Text>
        </TouchableOpacity>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View className="mb-3">
          <Text className="text-sm text-gray-500 mb-2">Категории</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <View
                key={category.id}
                className="bg-blue-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-blue-700 font-medium">{category.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <View>
          <Text className="text-sm text-gray-500 mb-2">Навыки</Text>
          <View className="flex-row flex-wrap gap-2">
            {skills.map((skill) => (
              <View
                key={skill.id}
                className="bg-gray-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-gray-700">{skill.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
