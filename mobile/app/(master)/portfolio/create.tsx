import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface PortfolioImage {
  uri: string;
  id: string;
}

export default function CreatePortfolioItemPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Общие работы',
    duration: '',
    cost: '',
    client_feedback: '',
    skills_used: [] as string[],
  });

  const categories = [
    'Общие работы',
    'Сантехника',
    'Электрика',
    'Ремонт и отделка',
    'Клининг',
    'Столярные работы',
    'Дизайн интерьера',
    'Ландшафтный дизайн',
    'Автосервис',
    'IT услуги'
  ];

  const availableSkills = [
    'Сантехника', 'Электрика', 'Плитка', 'Покраска', 'Обои',
    'Ламинат', 'Гипсокартон', 'Натяжные потолки', 'Сварка',
    'Столярные работы', 'Дизайн', 'Клининг', 'Ремонт техники'
  ];

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages: PortfolioImage[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          id: `${Date.now()}_${index}`
        }));
        setImages(prev => [...prev, ...newImages].slice(0, 10));
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображения');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к камере');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: PortfolioImage = {
          uri: result.assets[0].uri,
          id: Date.now().toString()
        };
        setImages(prev => [...prev, newImage].slice(0, 10));
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const addImage = () => {
    Alert.alert(
      'Добавить фото',
      'Выберите способ добавления фото',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Галерея', onPress: pickImages },
        { text: 'Камера', onPress: takePhoto }
      ]
    );
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_used: prev.skills_used.includes(skill)
        ? prev.skills_used.filter(s => s !== skill)
        : [...prev.skills_used, skill]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Ошибка', 'Введите название работы');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Ошибка', 'Добавьте описание работы');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно фото');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Успех',
        'Работа добавлена в портфолио',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить работу в портфолио');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Добавить работу</Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          {/* Title */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Основная информация</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Название работы *</Text>
                <TextInput
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="Например: Ремонт ванной комнаты"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Описание работы *</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Опишите что было сделано, какие материалы использовались..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Категория</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {categories.map(category => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => setFormData(prev => ({ ...prev, category }))}
                        className={`px-4 py-2 rounded-full ${
                          formData.category === category
                            ? 'bg-[#0165FB]'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          formData.category === category ? 'text-white' : 'text-gray-700'
                        }`}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Photos */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Фотографии *</Text>
              <Text className="text-sm text-gray-500">{images.length}/10</Text>
            </View>

            {images.length === 0 ? (
              <TouchableOpacity
                onPress={addImage}
                className="border-2 border-dashed border-gray-300 rounded-3xl p-8 items-center"
              >
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="camera" size={32} color="#6B7280" />
                </View>
                <Text className="text-gray-600 font-medium mb-2">Добавить фотографии</Text>
                <Text className="text-gray-500 text-sm text-center">
                  Покажите результат своей работы
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {images.map((image) => (
                    <View key={image.id} className="relative">
                      <Image 
                        source={{ uri: image.uri }} 
                        className="w-20 h-20 rounded-2xl"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                      >
                        <Ionicons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {images.length < 10 && (
                    <TouchableOpacity
                      onPress={addImage}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center"
                    >
                      <Ionicons name="add" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text className="text-xs text-gray-500">
                  Первое фото будет использовано как обложка
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Детали проекта</Text>
            
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Длительность</Text>
                  <TextInput
                    value={formData.duration}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                    placeholder="3 дня"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Стоимость</Text>
                  <TextInput
                    value={formData.cost}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                    placeholder="15000 сом"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Отзыв клиента</Text>
                <TextInput
                  value={formData.client_feedback}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, client_feedback: text }))}
                  placeholder="Что сказал клиент о работе..."
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Skills */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Использованные навыки</Text>
            
            <View className="flex-row flex-wrap gap-2">
              {availableSkills.map(skill => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`px-3 py-2 rounded-full ${
                    formData.skills_used.includes(skill)
                      ? 'bg-[#0165FB]'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    formData.skills_used.includes(skill) ? 'text-white' : 'text-gray-700'
                  }`}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-2xl shadow-lg mb-6 ${
              loading ? 'bg-gray-400' : 'bg-[#0165FB]'
            }`}
          >
            <Text className="text-center font-semibold text-white text-lg">
              {loading ? 'Добавление...' : 'Добавить в портфолио'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}