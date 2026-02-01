/**
 * Гибкая система адресов для Кыргызстана
 * Учитывает особенности местной адресации
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { AccessibleTextInput } from '../common/AccessibleTextInput';
import { useTranslation } from '../../hooks/useTranslation';

// Районы и микрорайоны Бишкека
const BISHKEK_DISTRICTS = {
  center: {
    name: { ru: 'Центр', ky: 'Борбор' },
    landmarks: [
      'ЦУМ', 'Ала-Тоо площадь', 'Филармония', 'Дубовый парк',
      'Театр оперы и балета', 'Площадь Победы', 'Старый автовокзал'
    ]
  },

  vostok5: {
    name: { ru: 'Восток-5', ky: 'Чыгыш-5' },
    landmarks: [
      'Мега Центр', 'Дордой Плаза', 'Рынок Дордой', 'Ипподром',
      'Восточный автовокзал', 'Парк Ататюрк'
    ]
  },

  jal: {
    name: { ru: 'Джал', ky: 'Жал' },
    landmarks: [
      'Ошский рынок', 'Западный автовокзал', 'Парк Панфилова',
      'Цирк', 'Стадион Спартак', 'Рынок Аламедин'
    ]
  },

  kokjar: {
    name: { ru: 'Кок-Жар', ky: 'Көк-Жар' },
    landmarks: [
      'Бета Сторес', 'Рынок Кок-Жар', 'Парк Ынтымак',
      'Стадион Динамо', 'Политех', 'Медакадемия'
    ]
  }
};

// Районы Оша
const OSH_DISTRICTS = {
  center: {
    name: { ru: 'Центр Оша', ky: 'Ош борбору' },
    landmarks: [
      'Сулайман-Тоо', 'Центральная мечеть', 'Рынок Жайма',
      'Парк Навои', 'Драмтеатр', 'Областная администрация'
    ]
  },

  new_osh: {
    name: { ru: 'Новый Ош', ky: 'Жаңы Ош' },
    landmarks: [
      'Аэропорт Ош', 'Университет', 'Новый рынок',
      'Спорткомплекс', 'Больница', 'Автовокзал'
    ]
  }
};

interface FlexibleAddressInputProps {
  value?: {
    type: 'exact' | 'landmark' | 'district';
    value: string;
    district?: string;
    landmark?: string;
    phoneConfirmation: boolean;
  };
  onChange: (address: any) => void;
  region: 'bishkek' | 'osh' | 'other';
  language: 'ru' | 'ky';
}

export function FlexibleAddressInput({
  value,
  onChange,
  region,
  language
}: FlexibleAddressInputProps) {

  const { t } = useTranslation();

  const [addressType, setAddressType] = useState<'exact' | 'landmark' | 'district'>(
    value?.type || 'landmark'
  );
  const [addressValue, setAddressValue] = useState(value?.value || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value?.district || '');
  const [selectedLandmark, setSelectedLandmark] = useState(value?.landmark || '');
  const [phoneConfirmation, setPhoneConfirmation] = useState(
    value?.phoneConfirmation ?? true
  );

  // Получаем районы в зависимости от региона
  const getDistricts = () => {
    switch (region) {
      case 'bishkek':
        return BISHKEK_DISTRICTS;
      case 'osh':
        return OSH_DISTRICTS;
      default:
        return {};
    }
  };

  const districts: any = getDistricts();

  // Обновляем родительский компонент при изменениях
  useEffect(() => {
    onChange({
      type: addressType,
      value: addressValue,
      district: selectedDistrict,
      landmark: selectedLandmark,
      phoneConfirmation
    });
  }, [addressType, addressValue, selectedDistrict, selectedLandmark, phoneConfirmation]);

  // Автозаполнение при выборе ориентира
  const handleLandmarkSelect = (landmark: string) => {
    setSelectedLandmark(landmark);
    if (addressType === 'landmark') {
      setAddressValue(`Рядом с ${landmark}`);
    }
  };

  // Показать примеры адресов
  const showAddressExamples = () => {
    const examples = {
      exact: [
        'ул. Чуй 123, кв. 45',
        'мкр. Джал, 15-й дом, 2 подъезд',
        'ул. Киевская 89, частный дом'
      ],
      landmark: [
        'Рядом с ЦУМом, за углом',
        'Напротив школы №5, белый дом',
        'Возле Мега Центра, 2-й этаж'
      ],
      district: [
        'Восток-5, возле Дордой Плазы',
        'Джал, район Ошского рынка',
        'Центр, недалеко от Филармонии'
      ]
    };

    Alert.alert(
      'Примеры адресов',
      examples[addressType].join('\n\n'),
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3 text-gray-900">
          {language === 'ky' ? 'Иштин жери кайда?' : 'Где выполнить работу?'}
        </Text>

        {/* Выбор типа адреса */}
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setAddressType('landmark')}
            className={`flex-1 py-3 px-2 rounded-md ${addressType === 'landmark' ? 'bg-blue-500' : 'bg-transparent'
              }`}
          >
            <Text className={`text-center text-sm font-medium ${addressType === 'landmark' ? 'text-white' : 'text-gray-700'
              }`}>
              {language === 'ky' ? 'Белги боюнча' : 'По ориентиру'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAddressType('district')}
            className={`flex-1 py-3 px-2 rounded-md ${addressType === 'district' ? 'bg-blue-500' : 'bg-transparent'
              }`}
          >
            <Text className={`text-center text-sm font-medium ${addressType === 'district' ? 'text-white' : 'text-gray-700'
              }`}>
              {language === 'ky' ? 'Район' : 'Район'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAddressType('exact')}
            className={`flex-1 py-3 px-2 rounded-md ${addressType === 'exact' ? 'bg-blue-500' : 'bg-transparent'
              }`}
          >
            <Text className={`text-center text-sm font-medium ${addressType === 'exact' ? 'text-white' : 'text-gray-700'
              }`}>
              {language === 'ky' ? 'Так дарек' : 'Точный адрес'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Поля ввода в зависимости от типа */}
        {addressType === 'landmark' && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-medium text-gray-700">
                {language === 'ky' ? 'Белгилерди сүрөттөңүз' : 'Опишите ориентиры'}
              </Text>
              <TouchableOpacity onPress={showAddressExamples}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <AccessibleTextInput
              label={language === 'ky' ? 'Белгилерди сүрөттөңүз' : 'Опишите ориентиры'}
              value={addressValue}
              onChangeText={setAddressValue}
              placeholder={
                language === 'ky'
                  ? 'Мисалы: ЦУМдун жанында, ак үй'
                  : 'Например: рядом с ЦУМом, белый дом'
              }
              multiline
              numberOfLines={3}
              className="mb-3"
            />

            {/* Популярные ориентиры */}
            {Object.keys(districts).length > 0 && (
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  {language === 'ky' ? 'Популярдуу белгилер:' : 'Популярные ориентиры:'}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.values(districts).flatMap((district: any) =>
                    district.landmarks.slice(0, 6).map((landmark: any, index: number) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleLandmarkSelect(landmark)}
                        className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-full"
                      >
                        <Text className="text-blue-700 text-sm">{landmark}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {addressType === 'district' && (
          <View>
            <Text className="text-base font-medium text-gray-700 mb-2">
              {language === 'ky' ? 'Районду тандаңыз' : 'Выберите район'}
            </Text>

            {Object.keys(districts).length > 0 ? (
              <View className="border border-gray-300 rounded-lg mb-3">
                <Picker
                  selectedValue={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  style={{ height: 50 }}
                >
                  <Picker.Item
                    label={language === 'ky' ? 'Районду тандаңыз' : 'Выберите район'}
                    value=""
                  />
                  {Object.entries(districts).map(([key, district]: [string, any]) => (
                    <Picker.Item
                      key={key}
                      label={district.name[language]}
                      value={key}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <AccessibleTextInput
                label={language === 'ky' ? 'Районду тандаңыз' : 'Выберите район'}
                value={selectedDistrict}
                onChangeText={setSelectedDistrict}
                placeholder={
                  language === 'ky'
                    ? 'Районду жазыңыз'
                    : 'Укажите район'
                }
                className="mb-3"
              />
            )}

            <AccessibleTextInput
              label={language === 'ky' ? 'Жайгашкан жерди тактаңыз' : 'Уточните местоположение'}
              value={addressValue}
              onChangeText={setAddressValue}
              placeholder={
                language === 'ky'
                  ? 'Райондогу так жерди көрсөтүңүз'
                  : 'Уточните местоположение в районе'
              }
              multiline
              numberOfLines={2}
            />

            {/* Ориентиры выбранного района */}
            {selectedDistrict && districts[selectedDistrict] && (
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  {language === 'ky' ? 'Белгилер:' : 'Ориентиры:'}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(districts[selectedDistrict] as any).landmarks.map((landmark: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setAddressValue(`${addressValue} (возле ${landmark})`.trim())}
                      className="bg-gray-100 border border-gray-200 px-2 py-1 rounded"
                    >
                      <Text className="text-gray-700 text-xs">{landmark}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {addressType === 'exact' && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-medium text-gray-700">
                {language === 'ky' ? 'Так даректи жазыңыз' : 'Укажите точный адрес'}
              </Text>
              <TouchableOpacity onPress={showAddressExamples}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <AccessibleTextInput
              label={language === 'ky' ? 'Так даректи жазыңыз' : 'Укажите точный адрес'}
              value={addressValue}
              onChangeText={setAddressValue}
              placeholder={
                language === 'ky'
                  ? 'Көчө, үй номери, батир'
                  : 'Улица, номер дома, квартира'
              }
              multiline
              numberOfLines={3}
            />

            <Text className="text-xs text-gray-500 mt-1">
              {language === 'ky'
                ? 'Мисал: Чүй көчөсү 123, 45-батир'
                : 'Пример: ул. Чуй 123, кв. 45'
              }
            </Text>
          </View>
        )}

        {/* Подтверждение по телефону */}
        <View className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-medium text-yellow-800">
                {language === 'ky'
                  ? 'Телефон аркылуу ырастоо'
                  : 'Подтверждение по телефону'
                }
              </Text>
              <Text className="text-xs text-yellow-700 mt-1">
                {language === 'ky'
                  ? 'Усталык даректи так билүү үчүн чалат'
                  : 'Мастер позвонит для уточнения адреса'
                }
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setPhoneConfirmation(!phoneConfirmation)}
              className={`w-12 h-6 rounded-full ${phoneConfirmation ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <View className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${phoneConfirmation ? 'ml-6' : 'ml-0.5'
                }`} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Дополнительные инструкции */}
        <View className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" className="mr-2 mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm text-blue-800">
                {language === 'ky'
                  ? 'Кеңеш: Даректи канчалык так көрсөтсөңүз, усталык ошончолук тез табат'
                  : 'Совет: Чем точнее адрес, тем быстрее мастер вас найдет'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Кнопка "Использовать текущее местоположение" */}
        <TouchableOpacity
          className="mt-4 bg-green-500 p-3 rounded-lg flex-row items-center justify-center"
          onPress={() => {
            // Получить GPS координаты и преобразовать в адрес
            Alert.alert(
              language === 'ky' ? 'GPS жайгашуу' : 'GPS местоположение',
              language === 'ky'
                ? 'Учурдагы жайгашууңузду колдонууну каалайсызбы?'
                : 'Использовать ваше текущее местоположение?',
              [
                { text: language === 'ky' ? 'Жок' : 'Нет', style: 'cancel' },
                {
                  text: language === 'ky' ? 'Ооба' : 'Да',
                  onPress: () => {
                    // Реализовать получение GPS координат
                    console.log('Getting GPS location...');
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="location" size={20} color="white" className="mr-2" />
          <Text className="text-white font-medium">
            {language === 'ky'
              ? 'Учурдагы жайгашууну колдонуу'
              : 'Использовать текущее местоположение'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export { BISHKEK_DISTRICTS, OSH_DISTRICTS };