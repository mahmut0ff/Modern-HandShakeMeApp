import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { safeNavigate } from '../../../../hooks/useNavigation';

interface ReviewFormData {
  quality_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  comment: string;
}

export default function CreateReviewPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    quality_rating: 5,
    communication_rating: 5,
    punctuality_rating: 5,
    professionalism_rating: 5,
    comment: '',
  });

  // Mock project data
  const project = {
    id: Number(id),
    order_title: 'Ремонт ванной комнаты',
    master: {
      id: 1,
      name: 'Иван Петров',
      avatar: undefined
    },
    agreed_price: '28000'
  };

  const handleSubmit = async () => {
    if (!formData.comment.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, напишите комментарий');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert(
        'Успех',
        'Отзыв успешно отправлен!',
        [
          {
            text: 'OK',
            onPress: () => safeNavigate.push('/(client)/projects')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить отзыв');
    } finally {
      setLoading(false);
    }
  };

  const RatingInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string;
    value: number;
    onChange: (rating: number) => void;
  }) => (
    <View className="mb-6">
      <Text className="text-base font-semibold text-gray-900 mb-3">{label}</Text>
      <View className="flex-row justify-between items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            className="p-2"
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={32}
              color={star <= value ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-xs text-gray-500">Плохо</Text>
        <Text className="text-xs text-gray-500">Отлично</Text>
      </View>
    </View>
  );

  const overallRating = (
    formData.quality_rating +
    formData.communication_rating +
    formData.punctuality_rating +
    formData.professionalism_rating
  ) / 4;

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
          <Text className="text-2xl font-bold text-gray-900">Оставить отзыв</Text>
        </View>

        {/* Project Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-2">{project.order_title}</Text>
          <Text className="text-gray-600 mb-2">Мастер: {project.master.name}</Text>
          <Text className="text-green-600 font-semibold">{project.agreed_price} сом</Text>
        </View>

        {/* Overall Rating Display */}
        <View className="bg-[#0165FB] rounded-3xl p-5 mb-6">
          <View className="items-center">
            <Text className="text-white/70 text-sm mb-2">Общая оценка</Text>
            <Text className="text-white text-4xl font-bold mb-2">
              {overallRating.toFixed(1)}
            </Text>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(overallRating) ? 'star' : 'star-outline'}
                  size={24}
                  color="white"
                />
              ))}
            </View>
          </View>
        </View>

        {/* Rating Form */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-6">Оцените работу мастера</Text>
          
          <RatingInput
            label="Качество работы"
            value={formData.quality_rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, quality_rating: rating }))}
          />
          
          <RatingInput
            label="Общение"
            value={formData.communication_rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, communication_rating: rating }))}
          />
          
          <RatingInput
            label="Пунктуальность"
            value={formData.punctuality_rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, punctuality_rating: rating }))}
          />
          
          <RatingInput
            label="Профессионализм"
            value={formData.professionalism_rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, professionalism_rating: rating }))}
          />
        </View>

        {/* Comment */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Комментарий</Text>
          <TextInput
            value={formData.comment}
            onChangeText={(text) => setFormData(prev => ({ ...prev, comment: text }))}
            placeholder="Расскажите о своём опыте работы с мастером..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="w-full p-4 bg-gray-50 rounded-2xl text-gray-900 min-h-[120px]"
          />
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
            {loading ? 'Отправка...' : 'Отправить отзыв'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}