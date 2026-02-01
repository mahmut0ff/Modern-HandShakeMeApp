import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useListCategoriesQuery,
  useGetCategorySkillsQuery,
  Skill,
} from '../../services/categoryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function SkillSelectionScreen() {
  const params = useLocalSearchParams<{
    selectedSkills?: string;
    maxSkills?: string;
    onComplete?: string;
  }>();

  const maxSkills = params.maxSkills ? parseInt(params.maxSkills) : 10;
  const initialSkills = params.selectedSkills ? JSON.parse(params.selectedSkills) : [];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(initialSkills);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading: loadingCategories } = useListCategoriesQuery();
  const {
    data: categorySkills,
    isLoading: loadingSkills,
    error: skillsError,
  } = useGetCategorySkillsQuery(selectedCategory || '', {
    skip: !selectedCategory,
  });

  const filteredSkills = useMemo(() => {
    if (!categorySkills?.skills) return [];
    if (!searchQuery.trim()) return categorySkills.skills;

    const query = searchQuery.toLowerCase();
    return categorySkills.skills.filter((skill) =>
      skill.name.toLowerCase().includes(query)
    );
  }, [categorySkills, searchQuery]);

  const toggleSkill = (skill: Skill) => {
    const isSelected = selectedSkills.some((s) => s.id === skill.id);

    if (isSelected) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      if (selectedSkills.length >= maxSkills) {
        Alert.alert('Ограничение', `Можно выбрать максимум ${maxSkills} навыков`);
        return;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleComplete = () => {
    if (selectedSkills.length === 0) {
      Alert.alert('Внимание', 'Выберите хотя бы один навык');
      return;
    }

    // Return to previous screen with selected skills
    router.back();
    // In real app, you would pass data back via navigation params or state management
  };

  if (loadingCategories) {
    return <LoadingSpinner />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Selected Skills Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold">Выбранные навыки</Text>
          <Text className="text-gray-500">
            {selectedSkills.length} / {maxSkills}
          </Text>
        </View>

        {selectedSkills.length > 0 ? (
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
        ) : (
          <Text className="text-gray-400 text-sm">Навыки не выбраны</Text>
        )}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200">
        <View className="flex-row p-2">
          {categories?.map((category) => (
            <TouchableOpacity
              key={category.id}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-600'
                  : 'bg-gray-100'
              }`}
              onPress={() => {
                setSelectedCategory(category.id);
                setSearchQuery('');
              }}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.icon} {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search */}
      {selectedCategory && (
        <View className="bg-white p-4 border-b border-gray-200">
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
      )}

      {/* Skills List */}
      <ScrollView className="flex-1">
        {!selectedCategory ? (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="apps-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-center mt-4">
              Выберите категорию для просмотра навыков
            </Text>
          </View>
        ) : loadingSkills ? (
          <LoadingSpinner />
        ) : skillsError ? (
          <ErrorMessage message="Не удалось загрузить навыки" />
        ) : filteredSkills.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-center mt-4">
              {searchQuery ? 'Навыки не найдены' : 'Нет доступных навыков'}
            </Text>
          </View>
        ) : (
          <View className="p-4">
            <Text className="text-sm text-gray-500 mb-3">
              {categorySkills?.category.name} • {filteredSkills.length} навыков
            </Text>
            <View className="flex-row flex-wrap">
              {filteredSkills.map((skill) => {
                const isSelected = selectedSkills.some((s) => s.id === skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text
                      className={`font-medium ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {skill.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      {selectedSkills.length > 0 && (
        <View className="bg-white p-4 border-t border-gray-200">
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center"
            onPress={handleComplete}
          >
            <Text className="text-white font-semibold text-base">
              Подтвердить выбор ({selectedSkills.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
