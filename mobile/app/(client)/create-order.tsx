import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useCreateOrderMutation,
  useGetCategoriesQuery,
  useAddOrderFileMutation,
  Category,
  Skill
} from '../../services/orderApi';
import { useGetCategorySkillsQuery } from '../../services/categoryApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { safeNavigate } from '../../hooks/useNavigation';

const MATERIAL_STATUS_OPTIONS = [
  { value: '', label: 'Не указано' },
  { value: 'client_provides', label: 'Материалы предоставлю' },
  { value: 'master_buys', label: 'Мастер закупает' },
  { value: 'need_consultation', label: 'Нужна консультация' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'any', label: 'Любой' },
  { value: '1-3', label: '1-3 года' },
  { value: '3-5', label: '3-5 лет' },
  { value: '5+', label: 'Более 5 лет' },
];

export default function CreateOrderPage() {
  const [step, setStep] = useState(1);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: 0,
    subcategory: 0,
    required_skills: [] as number[],
    title: '',
    description: '',
    city: '',
    address: '',
    hide_address: true,
    start_date: '',
    end_date: '',
    is_urgent: false,
    work_volume: '',
    floor: '',
    has_elevator: null as boolean | null,
    material_status: '',
    has_electricity: null as boolean | null,
    has_water: null as boolean | null,
    can_store_tools: null as boolean | null,
    has_parking: null as boolean | null,
    required_experience: 'any',
    need_team: false,
    additional_requirements: '',
    budget_type: 'negotiable' as 'fixed' | 'range' | 'negotiable',
    budget_min: '',
    budget_max: '',
  });

  // API queries and mutations
  const {
    data: categoriesData,
    isLoading: categoriesLoading
  } = useGetCategoriesQuery();

  const {
    data: skillsData,
    isLoading: skillsLoading
  } = useGetCategorySkillsQuery(formData.category, {
    skip: !formData.category
  });

  // Handle both array and paginated responses
  const categories = (categoriesData || []) as Category[];
  const skills = (skillsData?.skills || []) as Skill[];

  const [createOrder, { isLoading: createLoading }] = useCreateOrderMutation();
  const [addOrderFile] = useAddOrderFileMutation();

  const handleMediaSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      if (result.assets.length + mediaFiles.length > 10) {
        Alert.alert('Ошибка', 'Максимум 10 файлов');
        return;
      }
      const newFiles = result.assets.map(asset => asset.uri);
      setMediaFiles([...mediaFiles, ...newFiles]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category) {
        Alert.alert('Ошибка', 'Заполните все обязательные поля');
        return;
      }

      // Prepare order data
      const orderData = {
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        required_skills: formData.required_skills,
        title: formData.title,
        description: formData.description,
        city: formData.city,
        address: formData.address,
        hide_address: formData.hide_address,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_urgent: formData.is_urgent,
        work_volume: formData.work_volume || undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        has_elevator: formData.has_elevator,
        material_status: formData.material_status || undefined,
        has_electricity: formData.has_electricity,
        has_water: formData.has_water,
        can_store_tools: formData.can_store_tools,
        has_parking: formData.has_parking,
        required_experience: formData.required_experience,
        need_team: formData.need_team,
        additional_requirements: formData.additional_requirements || undefined,
        budget_type: formData.budget_type,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        is_public: true,
        auto_close_applications: true
      };

      // Create order
      const result = await createOrder(orderData).unwrap();

      // Upload files if any
      if (mediaFiles.length > 0) {
        for (const fileUri of mediaFiles) {
          try {
            const formData = new FormData();
            formData.append('file', {
              uri: fileUri,
              type: 'image/jpeg',
              name: 'order-image.jpg',
            } as any);

            await addOrderFile({ orderId: result.id, file: formData }).unwrap();
          } catch (fileError) {
            console.error('File upload error:', fileError);
            // Continue with other files even if one fails
          }
        }
      }

      Alert.alert('Успех', 'Заказ создан успешно', [
        { text: 'OK', onPress: () => safeNavigate.push('/(client)/orders') }
      ]);
    } catch (error: any) {
      console.error('Create order error:', error);
      Alert.alert(
        'Ошибка',
        error.data?.message || 'Не удалось создать заказ'
      );
    }
  };

  const steps = [
    { num: 1, title: 'Описание', icon: 'document-text' },
    { num: 2, title: 'Место', icon: 'location' },
    { num: 3, title: 'Условия', icon: 'home' },
    { num: 4, title: 'Бюджет', icon: 'wallet' },
  ];

  if (categoriesLoading) {
    return <LoadingSpinner fullScreen text="Загрузка категорий..." />;
  }

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
          <Text className="text-2xl font-bold text-gray-900">Новый заказ</Text>
        </View>

        {/* Progress Steps */}
        <View className="flex-row items-center justify-between bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-6">
          {steps.map((s, idx) => (
            <View key={s.num} className="flex-row items-center">
              <View className="flex-col items-center">
                <View className={`w-10 h-10 rounded-2xl items-center justify-center ${s.num <= step ? 'bg-[#0165FB] shadow-lg' : 'bg-gray-100'
                  }`}>
                  <Ionicons
                    name={s.icon as any}
                    size={18}
                    color={s.num <= step ? 'white' : '#9CA3AF'}
                  />
                </View>
                <Text className={`text-[10px] mt-1 font-medium ${s.num <= step ? 'text-[#0165FB]' : 'text-gray-400'
                  }`}>
                  {s.title}
                </Text>
              </View>
              {idx < steps.length - 1 && (
                <View className={`w-8 h-1 mx-1 rounded-full ${s.num < step ? 'bg-[#0165FB]' : 'bg-gray-200'
                  }`} />
              )}
            </View>
          ))}
        </View>

        {/* Form Card */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          {step === 1 && (
            <View className="flex flex-col gap-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="document-text" size={20} color="#0165FB" />
                <Text className="text-lg font-bold text-gray-900">Категория и описание</Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Категория *</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Show category picker modal or navigate to category selection
                    Alert.alert(
                      'Выберите категорию',
                      '',
                      categories.map(cat => ({
                        text: cat.name,
                        onPress: () => setFormData({ ...formData, category: cat.id })
                      })).concat([{ text: 'Отмена', onPress: () => { } }])
                    );
                  }}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="grid" size={16} color="#9CA3AF" />
                    <Text className={formData.category ? 'text-gray-900' : 'text-gray-400'}>
                      {formData.category
                        ? categories.find(c => c.id === formData.category)?.name || 'Выберите категорию'
                        : 'Выберите категорию'
                      }
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Skills Selection */}
              {formData.category && skills.length > 0 && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Требуемые навыки</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {skills.map(skill => (
                      <TouchableOpacity
                        key={skill.id}
                        onPress={() => {
                          const isSelected = formData.required_skills.includes(skill.id);
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              required_skills: formData.required_skills.filter(id => id !== skill.id)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              required_skills: [...formData.required_skills, skill.id]
                            });
                          }
                        }}
                        className={`px-3 py-2 rounded-full border ${formData.required_skills.includes(skill.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-200'
                          }`}
                      >
                        <Text className={`text-sm font-medium ${formData.required_skills.includes(skill.id) ? 'text-white' : 'text-gray-700'
                          }`}>
                          {skill.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Название *</Text>
                <TextInput
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Например: Ремонт ванной комнаты"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Описание *</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Опишите подробно, что нужно сделать..."
                  multiline
                  numberOfLines={4}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                  textAlignVertical="top"
                />
              </View>

              {/* Media Upload */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Фото/видео (до 10)</Text>
                <View className="flex-row flex-wrap gap-2">
                  {mediaFiles.map((uri, idx) => (
                    <View key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <Image source={{ uri }} className="w-full h-full" />
                      <TouchableOpacity
                        onPress={() => removeMedia(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {mediaFiles.length < 10 && (
                    <TouchableOpacity
                      onPress={handleMediaSelect}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center"
                    >
                      <Ionicons name="add" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View className="flex flex-col gap-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="location" size={20} color="#0165FB" />
                <Text className="text-lg font-bold text-gray-900">Место и сроки</Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Город *</Text>
                  <TextInput
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholder="Бишкек"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Этаж</Text>
                  <TextInput
                    value={formData.floor}
                    onChangeText={(text) => setFormData({ ...formData, floor: text })}
                    placeholder="5"
                    keyboardType="numeric"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Адрес</Text>
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="ул. Примерная, д. 1"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>

              <TouchableOpacity
                onPress={() => setFormData({ ...formData, hide_address: !formData.hide_address })}
                className="flex-row items-center gap-3 p-3 bg-[#0165FB]/10 rounded-2xl"
              >
                <View className={`w-5 h-5 rounded-lg border-2 items-center justify-center ${formData.hide_address ? 'bg-[#0165FB] border-[#0165FB]' : 'border-gray-300'
                  }`}>
                  {formData.hide_address && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text className="text-sm text-gray-700">Скрыть адрес до выбора мастера</Text>
              </TouchableOpacity>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Объём работ</Text>
                <TextInput
                  value={formData.work_volume}
                  onChangeText={(text) => setFormData({ ...formData, work_volume: text })}
                  placeholder="Например: 50 м², 3 комнаты"
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                />
              </View>

              <TouchableOpacity
                onPress={() => setFormData({ ...formData, is_urgent: !formData.is_urgent })}
                className="flex-row items-center gap-3 p-3 bg-red-50 rounded-2xl"
              >
                <View className={`w-5 h-5 rounded-lg border-2 items-center justify-center ${formData.is_urgent ? 'bg-red-600 border-red-600' : 'border-gray-300'
                  }`}>
                  {formData.is_urgent && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <View>
                  <Text className="text-sm font-medium text-red-700">Срочный заказ</Text>
                  <Text className="text-xs text-red-500">Будет выделен в списке</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View className="flex flex-col gap-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="home" size={20} color="#0165FB" />
                <Text className="text-lg font-bold text-gray-900">Условия на объекте</Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-3">Есть лифт?</Text>
                <View className="flex-row gap-3">
                  {[
                    { value: true, label: 'Да' },
                    { value: false, label: 'Нет' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      onPress={() => setFormData({ ...formData, has_elevator: option.value })}
                      className={`flex-1 p-3 rounded-xl border ${formData.has_elevator === option.value
                        ? 'bg-[#0165FB]/10 border-[#0165FB]'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <Text className={`text-center font-medium ${formData.has_elevator === option.value ? 'text-[#0165FB]' : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-3">Материалы</Text>
                <View className="flex flex-col gap-2">
                  {MATERIAL_STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFormData({ ...formData, material_status: option.value })}
                      className={`p-3 rounded-xl border ${formData.material_status === option.value
                        ? 'bg-[#0165FB]/10 border-[#0165FB]'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <Text className={`font-medium ${formData.material_status === option.value ? 'text-[#0165FB]' : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Дополнительные требования</Text>
                <TextInput
                  value={formData.additional_requirements}
                  onChangeText={(text) => setFormData({ ...formData, additional_requirements: text })}
                  placeholder="Укажите особые требования к работе..."
                  multiline
                  numberOfLines={3}
                  className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {step === 4 && (
            <View className="flex flex-col gap-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="wallet" size={20} color="#0165FB" />
                <Text className="text-lg font-bold text-gray-900">Бюджет</Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-3">Тип бюджета</Text>
                <View className="flex flex-col gap-2">
                  {[
                    { value: 'fixed', label: 'Фиксированная сумма' },
                    { value: 'range', label: 'Диапазон цен' },
                    { value: 'negotiable', label: 'Договорная' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFormData({ ...formData, budget_type: option.value as any })}
                      className={`p-3 rounded-xl border ${formData.budget_type === option.value
                        ? 'bg-[#0165FB]/10 border-[#0165FB]'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <Text className={`font-medium ${formData.budget_type === option.value ? 'text-[#0165FB]' : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.budget_type === 'fixed' && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Сумма (сом)</Text>
                  <TextInput
                    value={formData.budget_min}
                    onChangeText={(text) => setFormData({ ...formData, budget_min: text })}
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {formData.budget_type === 'range' && (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">От (сом)</Text>
                    <TextInput
                      value={formData.budget_min}
                      onChangeText={(text) => setFormData({ ...formData, budget_min: text })}
                      placeholder="5000"
                      className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">До (сом)</Text>
                    <TextInput
                      value={formData.budget_max}
                      onChangeText={(text) => setFormData({ ...formData, budget_max: text })}
                      placeholder="15000"
                      className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Navigation */}
          <View className="flex-row justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 1 ? (
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                className="flex-row items-center gap-2 px-5 py-2.5 bg-gray-100 rounded-2xl"
              >
                <Ionicons name="arrow-back" size={16} color="#6B7280" />
                <Text className="font-medium text-gray-700">Назад</Text>
              </TouchableOpacity>
            ) : <View />}

            {step < 4 ? (
              <TouchableOpacity
                onPress={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.title || !formData.description || !formData.category)}
                className={`flex-row items-center gap-2 px-5 py-2.5 bg-[#0165FB] rounded-2xl shadow-lg ${step === 1 && (!formData.title || !formData.description || !formData.category) ? 'opacity-50' : ''
                  }`}
              >
                <Text className="font-semibold text-white">Далее</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createLoading}
                className={`flex-row items-center gap-2 px-5 py-2.5 bg-[#0165FB] rounded-2xl shadow-lg ${createLoading ? 'opacity-50' : ''
                  }`}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text className="font-semibold text-white">
                  {createLoading ? 'Создание...' : 'Создать заказ'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}