import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../hooks/redux';

export default function EditMasterProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic info
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    phone: user?.phone || '',
    
    // Professional info
    company_name: 'ИП Мастер Сервис',
    description: 'Профессиональный мастер с опытом работы более 10 лет. Выполняю качественные работы в срок.',
    experience_years: '10',
    
    // Location
    city: 'Бишкек',
    address: 'ул. Примерная, д. 15',
    travel_radius: '25',
    
    // Work conditions
    has_transport: true,
    has_tools: true,
    can_purchase_materials: false,
    
    // Rates
    hourly_rate: '1500',
    daily_rate: '12000',
    min_order_cost: '3000',
    
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
    categories: ['Сантехника', 'Электрика', 'Мелкий ремонт'],
    skills: ['Установка смесителей', 'Замена труб', 'Монтаж розеток'],
  });

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
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Успех', 'Профиль обновлён!');
      router.back();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
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
        { text: 'Выбрать из галереи', onPress: () => {/* TODO: Open image picker */} },
        { text: 'Сделать фото', onPress: () => {/* TODO: Open camera */} },
        { text: 'Удалить фото', style: 'destructive', onPress: () => {/* TODO: Delete avatar */} },
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
          
          <View className="space-y-4">
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
          
          <View className="space-y-4">
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
          
          <View className="space-y-4">
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
          
          <View className="space-y-4">
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
          
          <View className="space-y-4">
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
          
          <View className="space-y-3">
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