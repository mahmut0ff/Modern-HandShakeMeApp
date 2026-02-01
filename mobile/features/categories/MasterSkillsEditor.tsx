import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CategoryPicker from '../../components/categories/CategoryPicker';
import SkillsSelector from '../../components/categories/SkillsSelector';
import { Category, Skill } from '../../services/categoryApi';

interface MasterSkillsEditorProps {
  initialCategory?: Category;
  initialSkills?: Skill[];
  onSave?: (category: Category, skills: Skill[]) => void;
}

export default function MasterSkillsEditor({
  initialCategory,
  initialSkills = [],
  onSave,
}: MasterSkillsEditorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(
    initialCategory
  );
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(initialSkills);
  const [errors, setErrors] = useState<{ category?: string; skills?: string }>({});

  const validate = (): boolean => {
    const newErrors: { category?: string; skills?: string } = {};

    if (!selectedCategory) {
      newErrors.category = 'Выберите категорию';
    }

    if (selectedSkills.length === 0) {
      newErrors.skills = 'Выберите хотя бы один навык';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    if (onSave && selectedCategory) {
      onSave(selectedCategory, selectedSkills);
    }
  };

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    // Clear skills when category changes
    setSelectedSkills([]);
    setErrors({});
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Info Card */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex-row">
          <Ionicons name="information-circle" size={24} color="#2563EB" />
          <Text className="flex-1 text-blue-800 text-sm ml-3">
            Выберите категорию и навыки, которыми вы владеете. Это поможет клиентам найти вас.
          </Text>
        </View>

        {/* Category Selection */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Категория <Text className="text-red-500">*</Text>
          </Text>
          <CategoryPicker
            selectedCategoryId={selectedCategory?.id}
            onSelect={handleCategoryChange}
            placeholder="Выберите категорию услуг"
            error={errors.category}
          />
        </View>

        {/* Skills Selection */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Навыки <Text className="text-red-500">*</Text>
          </Text>
          <SkillsSelector
            categoryId={selectedCategory?.id}
            selectedSkills={selectedSkills}
            onSkillsChange={setSelectedSkills}
            maxSkills={10}
            placeholder="Выберите ваши навыки"
            error={errors.skills}
          />
          <Text className="text-xs text-gray-500 mt-1">
            Выберите до 10 навыков, которыми вы владеете
          </Text>
        </View>

        {/* Selected Summary */}
        {selectedCategory && selectedSkills.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <Text className="font-semibold mb-3">Ваш профиль:</Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">{selectedCategory.icon}</Text>
              <Text className="font-medium text-gray-800">{selectedCategory.name}</Text>
            </View>
            <View className="flex-row flex-wrap mt-2">
              {selectedSkills.map((skill) => (
                <View key={skill.id} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-gray-700 text-sm">{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 items-center"
          onPress={handleSave}
        >
          <Text className="text-white font-semibold text-base">Сохранить</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
