import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector } from '../../hooks/redux';
import { 
  useGetMyMasterProfileQuery, 
  useUpdateMasterProfileMutation 
} from '../../services/profileApi';
import { useUploadAvatarMutation, useDeleteAvatarMutation } from '../../services/authApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function EditMasterProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  
  // API hooks
  const { data: profile, isLoading: profileLoading } = useGetMyMasterProfileQuery();
  const [updateProfile] = useUpdateMasterProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [deleteAvatar] = useDeleteAvatarMutation();
  
  const [formData, setFormData] = useState({
    // Basic info
    first_name: '',
    last_name: '',
    phone: '',
    
    // Professional info
    company_name: '',
    description: '',
    experience_years: '',
    
    // Location
    city: '',
    address: '',
    travel_radius: '',
    
    // Work conditions
    has_transport: false,
    has_tools: false,
    can_purchase_materials: false,
    
    // Rates
    hourly_rate: '',
    daily_rate: '',
    min_order_cost: '',
    
    // Working hours
    working_hours: {
      mon: '09:00-18:00',
      tue: '09:00-18:00',
      wed: '09:00-18:00',
      thu: '09:00-18:00',
      fri: '09:00-18:00',
      sat: '10:00-16:00',
      sun: 'Выходной'
    },
    
    // Categories and skills
    categories: [] as string[],
    skills: [] as string[],
  });

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.user?.first_name || user?.firstName || '',
        last_name: profile.user?.last_name || user?.lastName || '',
        phone: profile.user?.phone || user?.phone || '',
        company_name: profile.company_name || '',
        description: profile.bio || '',
        experience_years: profile.experience_years?.toString() || '',
        city: profile.city || '',
        address: profile.address || '',
        travel_radius: profile.work_radius?.toString() || '',
        has_transport: profile.has_transport || false,
        has_tools: profile.has_tools || false,
        can_purchase_materials: false,
        hourly_rate: profile.hourly_rate || '',
        daily_rate: '',
        min_order_cost: profile.min_order_amount || '',
        working_hours: profile.work_schedule ? JSON.parse(profile.work_schedule) : {
          mon: '09:00-18:00',
          tue: '09:00-18:00',
          wed: '09:00-18:00',
          thu: '09:00-18:00',
          fri: '09:00-18:00',
          sat: '10:00-16:00',
          sun: 'Выходной'
        },
        categories: profile.categories_list?.map(c => c.name) || [],
        skills: profile.skills_list?.map(s => s.name) || [],
      });
    }
  }, [profile, user]);

  const availableCategories = [
    'Сантехника', 'Электрика', 'Ремонт', 'Отделка', 'Мебель', 
    'Клининг', 'Швейное дело', 'Столярные работы', 'Дизайн интерьера'
  ];

  const availableSkills = [
    'Установка смесителей', 'Замена труб', 'Прочистка канализации',
    'Монтаж розеток', 'Замена проводки', 'Установка светильников',
    'Поклейка обоев', 'Покраска стен', 'Укладка плитки',
    'Сборка мебели', 'Ремонт мебели', 'Установка полок'
  ];

  const weekDays = [
    { key: 'mon', label: 'Понедельник' },
    { key: 'tue', label: 'Вторник' },
    { key: 'wed', label: 'Среда' },
    { key: 'thu', label: 'Четверг' },
    { key: 'fri', label: 'Пятница' },
    { key: 'sat', label: 'Суббота' },
    { key: 'sun', label: 'Воскресенье' },
  ];

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Ошибка', 'Заполните имя и фамилию');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Ошибка', 'Добавьте описание своих услуг');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        description: formData.description,
        experience_years: formData.experience_years,
        city: formData.city,
        address: formData.address,
        travel_radius: formData.travel_radius,
        has_transport: formData.has_transport,
        has_tools: formData.has_tools,
        can_purchase_materials: formData.can_purchase_materials,
        hourly_rate: formData.hourly_rate,
        daily_rate: formData.daily_rate,
        min_order_cost: formData.min_order_cost,
        working_hours: formData.working_hours,
        categories: formData.categories,
        skills: formData.skills,
      }).unwrap();
      
      Alert.alert('Успех', 'Профиль обновлён!');
      router.back();
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Ошибка', error.data?.message || 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Изменить фото',
      'Выберите действие',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выбрать из галереи', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const formData = new FormData();
                formData.append('avatar', {
                  uri: result.assets[0].uri,
                  type: 'image/jpeg',
                  name: 'avatar.jpg',
                } as any);
                
                await uploadAvatar(formData).unwrap();
                Alert.alert('Успех', 'Фото профиля обновлено');
              }
            } catch (error: any) {
              console.error('Avatar upload error:', error);
              Alert.alert('Ошибка', 'Не удалось загрузить фото');
            }
          }
        },
        { 
          text: 'Сделать фото', 
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Ошибка', 'Нужен доступ к камере');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const formData = new FormData();
                formData.append('avatar', {
                  uri: result.assets[0].uri,
                  type: 'image/jpeg',
                  name: 'avatar.jpg',
                } as any);
                
                await uploadAvatar(formData).unwrap();
                Alert.alert('Успех', 'Фото профиля обновлено');
              }
            } catch (error: any) {
              console.error('Camera error:', error);
              Alert.alert('Ошибка', 'Не удалось сделать фото');
            }
          }
        },
        { 
          text: 'Удалить фото', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteAvatar().unwrap();
              Alert.alert('Успех', 'Фото профиля удалено');
            } catch (error: any) {
              console.error('Delete avatar error:', error);
              Alert.alert('Ошибка', 'Не удалось удалить фото');
            }
          }
        },
      ]
    );
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  if (profileLoading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Редактировать профиль</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-[#0165FB]'}`}
          >
            <Text className="text-white font-semibold">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Фото профиля</Text>
          <View className="items-center">
            <TouchableOpacity onPress={handleAvatarPress} className="relative">
              <View className="w-24 h-24 bg-[#0165FB] rounded-full items-center justify-center overflow-hidden">
                <Text className="text-white text-2xl font-bold">
                  {(formData.first_name.charAt(0) || 'М').toUpperCase()}
                </Text>
              </View>
              <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100">
                <Ionicons name="camera" size={16} color="#0165FB" />
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-gray-500 mt-2">Нажмите, чтобы изменить</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Личная информация</Text>
          
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Имя *</Text>
              <TextInput
                value={formData.first_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                placeholder="Введите имя"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Фамилия *</Text>
              <TextInput
                value={formData.last_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                placeholder="Введите фамилию"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Телефон</Text>
              <TextInput
                value={formData.phone}
                editable={false}
                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-500"
              />
              <Text className="text-xs text-gray-500 mt-1">
                Для изменения номера обратитесь в поддержку
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Info */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Профессиональная информация</Text>
          
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Название компании</Text>
              <TextInput
                value={formData.company_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company_name: text }))}
                placeholder="Введите название компании"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Описание услуг *</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Расскажите о своих услугах и опыте"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 min-h-[100px]"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Опыт работы (лет)</Text>
              <TextInput
                value={formData.experience_years}
                onChangeText={(text) => setFormData(prev => ({ ...prev, experience_years: text }))}
                placeholder="Введите количество лет"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Местоположение</Text>
          
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Город</Text>
              <TextInput
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="Выберите город"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Адрес</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="Введите адрес"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Радиус выезда (км)</Text>
              <TextInput
                value={formData.travel_radius}
                onChangeText={(text) => setFormData(prev => ({ ...prev, travel_radius: text }))}
                placeholder="Введите радиус выезда"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Work Conditions */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Условия работы</Text>
          
          <View className="flex flex-col gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">Есть транспорт</Text>
                <Text className="text-gray-500 text-sm">Могу добраться до клиента</Text>
              </View>
              <Switch
                value={formData.has_transport}
                onValueChange={(value) => setFormData(prev => ({ ...prev, has_transport: value }))}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">Есть инструменты</Text>
                <Text className="text-gray-500 text-sm">Работаю своими инструментами</Text>
              </View>
              <Switch
                value={formData.has_tools}
                onValueChange={(value) => setFormData(prev => ({ ...prev, has_tools: value }))}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">Могу закупить материалы</Text>
                <Text className="text-gray-500 text-sm">Помогу с покупкой материалов</Text>
              </View>
              <Switch
                value={formData.can_purchase_materials}
                onValueChange={(value) => setFormData(prev => ({ ...prev, can_purchase_materials: value }))}
                trackColor={{ false: '#E5E7EB', true: '#0165FB' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Rates */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Стоимость услуг</Text>
          
          <View className="flex flex-col gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Почасовая ставка (сом)</Text>
              <TextInput
                value={formData.hourly_rate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, hourly_rate: text }))}
                placeholder="Введите стоимость за час"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Дневная ставка (сом)</Text>
              <TextInput
                value={formData.daily_rate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, daily_rate: text }))}
                placeholder="Введите стоимость за день"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Минимальная стоимость заказа (сом)</Text>
              <TextInput
                value={formData.min_order_cost}
                onChangeText={(text) => setFormData(prev => ({ ...prev, min_order_cost: text }))}
                placeholder="Введите минимальную стоимость"
                keyboardType="numeric"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Working Hours */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Рабочие часы</Text>
          
          <View className="flex flex-col gap-3">
            {weekDays.map((day) => (
              <View key={day.key} className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-medium w-24">{day.label}</Text>
                <TextInput
                  value={formData.working_hours[day.key as keyof typeof formData.working_hours]}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    working_hours: { ...prev.working_hours, [day.key]: text }
                  }))}
                  placeholder="09:00-18:00"
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-gray-900 ml-3"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Специализации</Text>
          
          <View className="flex-row flex-wrap gap-2">
            {availableCategories.map(category => (
              <TouchableOpacity
                key={category}
                onPress={() => toggleCategory(category)}
                className={`px-3 py-2 rounded-full border ${
                  formData.categories.includes(category)
                    ? 'bg-[#0165FB] border-[#0165FB]'
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  formData.categories.includes(category) ? 'text-white' : 'text-gray-700'
                }`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Skills */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="font-semibold text-gray-900 mb-4">Навыки</Text>
          
          <View className="flex-row flex-wrap gap-2">
            {availableSkills.map(skill => (
              <TouchableOpacity
                key={skill}
                onPress={() => toggleSkill(skill)}
                className={`px-3 py-2 rounded-full border ${
                  formData.skills.includes(skill)
                    ? 'bg-green-500 border-green-500'
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  formData.skills.includes(skill) ? 'text-white' : 'text-gray-700'
                }`}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delete Account */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3">Опасная зона</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Удалить аккаунт',
                'Это действие нельзя отменить. Все ваши данные будут удалены.',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => {} }
                ]
              );
            }}
            className="flex-row items-center gap-3 p-3 bg-red-50 rounded-2xl"
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <Text className="text-red-600 font-medium">Удалить аккаунт</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}