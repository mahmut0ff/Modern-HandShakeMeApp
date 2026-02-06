import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetCategorySkillsQuery, Skill } from '../../services/categoryApi';
import { LoadingSpinner } from '../LoadingSpinner';

interface SkillsSelectorProps {
  categoryId?: number;
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  maxSkills?: number;
  placeholder?: string;
  error?: string;
}

export default function SkillsSelector({
  categoryId,
  selectedSkills,
  onSkillsChange,
  maxSkills = 10,
  placeholder = 'Выберите навыки',
  error,
}: SkillsSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: categoryData,
    isLoading,
  } = useGetCategorySkillsQuery(categoryId ? Number(categoryId) : 0, {
    skip: !categoryId,
  });

  const filteredSkills = searchQuery.trim()
    ? categoryData?.skills.filter((skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : categoryData?.skills;

  const toggleSkill = (skill: Skill) => {
    const isSelected = selectedSkills.some((s) => s.id === skill.id);

    if (isSelected) {
      onSkillsChange(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      if (selectedSkills.length >= maxSkills) {
        return;
      }
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skillId: number) => {
    onSkillsChange(selectedSkills.filter((s) => s.id !== skillId));
  };

  return (
    <>
      <TouchableOpacity
        className={`bg-white border rounded-lg px-4 py-3 ${error ? 'border-red-500' : 'border-gray-300'
          }`}
        onPress={() => {
          if (!categoryId) {
            return;
          }
          setModalVisible(true);
        }}
        disabled={!categoryId}
      >
        {selectedSkills.length > 0 ? (
          <View className="flex-row flex-wrap">
            {selectedSkills.map((skill) => (
              <View
                key={skill.id}
                className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
              >
                <Text className="text-blue-800 text-sm mr-1">{skill.name}</Text>
                <TouchableOpacity onPress={() => removeSkill(skill.id)}>
                  <Ionicons name="close-circle" size={16} color="#1E40AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Text className={categoryId ? 'text-gray-400' : 'text-gray-300'}>
              {categoryId ? placeholder : 'Сначала выберите категорию'}
            </Text>
            {categoryId && <Ionicons name="chevron-down" size={20} color="#6B7280" />}
          </View>
        )}
      </TouchableOpacity>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}

      <Text className="text-xs text-gray-500 mt-1">
        Выбрано: {selectedSkills.length} / {maxSkills}
      </Text>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View>
                <Text className="text-lg font-semibold">Выберите навыки</Text>
                <Text className="text-sm text-gray-500">
                  {selectedSkills.length} / {maxSkills}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <View className="p-4 bg-gray-50 border-b border-gray-200">
                <Text className="text-sm font-medium text-gray-700 mb-2">Выбранные:</Text>
                <View className="flex-row flex-wrap">
                  {selectedSkills.map((skill) => (
                    <View
                      key={skill.id}
                      className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                    >
                      <Text className="text-blue-800 text-sm mr-1">{skill.name}</Text>
                      <TouchableOpacity onPress={() => toggleSkill(skill)}>
                        <Ionicons name="close-circle" size={16} color="#1E40AF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Search */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Поиск навыков..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Skills List */}
            <ScrollView className="flex-1">
              {isLoading ? (
                <LoadingSpinner />
              ) : filteredSkills && filteredSkills.length > 0 ? (
                <View className="p-4">
                  <View className="flex-row flex-wrap">
                    {filteredSkills.map((skill) => {
                      const isSelected = selectedSkills.some((s) => s.id === skill.id);
                      const isDisabled = !isSelected && selectedSkills.length >= maxSkills;

                      return (
                        <TouchableOpacity
                          key={skill.id}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 border ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : isDisabled
                                ? 'bg-gray-100 border-gray-200'
                                : 'bg-white border-gray-300'
                            }`}
                          onPress={() => toggleSkill(skill)}
                          disabled={isDisabled}
                        >
                          <Text
                            className={`font-medium ${isSelected
                                ? 'text-white'
                                : isDisabled
                                  ? 'text-gray-400'
                                  : 'text-gray-700'
                              }`}
                          >
                            {skill.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View className="p-8 items-center">
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">
                    {searchQuery ? 'Навыки не найдены' : 'Нет доступных навыков'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Done Button */}
            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-3 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white font-semibold">
                  Готово ({selectedSkills.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
