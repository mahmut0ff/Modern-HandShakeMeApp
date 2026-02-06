import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  gdprApi,
  ExportSection,
  GDPRExportData,
} from '../../../services/gdprApi';

interface ExportDataScreenProps {
  onBack?: () => void;
}

export const ExportDataScreen: React.FC<ExportDataScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState<GDPRExportData | null>(null);
  const [selectedSections, setSelectedSections] = useState<ExportSection[]>([]);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  const sections: Array<{ key: ExportSection; label: string; icon: string; description: string }> = [
    { key: 'profile', label: 'Профиль', icon: 'person', description: 'Личная информация и настройки' },
    { key: 'orders', label: 'Заказы', icon: 'receipt', description: 'История заказов' },
    { key: 'applications', label: 'Отклики', icon: 'document-text', description: 'Отправленные и полученные отклики' },
    { key: 'projects', label: 'Проекты', icon: 'briefcase', description: 'Проектные данные' },
    { key: 'reviews', label: 'Отзывы', icon: 'star', description: 'Оставленные и полученные отзывы' },
    { key: 'messages', label: 'Сообщения', icon: 'chatbubbles', description: 'История переписки' },
    { key: 'notifications', label: 'Уведомления', icon: 'notifications', description: 'История уведомлений' },
    { key: 'wallet', label: 'Кошелек', icon: 'wallet', description: 'Баланс и транзакции' },
    { key: 'portfolio', label: 'Портфолио', icon: 'images', description: 'Работы и изображения' },
  ];

  const toggleSection = (section: ExportSection) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const selectAll = () => {
    setSelectedSections(sections.map((s) => s.key));
  };

  const deselectAll = () => {
    setSelectedSections([]);
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const data = await gdprApi.exportUserData({
        format,
        includeFiles,
        sections: selectedSections.length > 0 ? selectedSections : undefined,
      });

      setExportData(data);
      Alert.alert('Успешно', 'Данные экспортированы. Вы можете скачать или поделиться ими.');
    } catch (error: any) {
      console.error('Export error:', error);

      if (error.response?.status === 429) {
        Alert.alert(
          'Превышен лимит',
          error.response?.data?.error || 'Пожалуйста, подождите перед следующим экспортом'
        );
      } else {
        Alert.alert('Ошибка', 'Не удалось экспортировать данные. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!exportData) return;

    try {
      const content = await gdprApi.downloadExportedData(exportData, format);
      const filename = `handshakeme_export_${new Date().toISOString().split('T')[0]}.${format}`;
      // Cast to any to avoid type errors with expo-file-system exports
      const fs = FileSystem as any;
      const fileUri = `${fs.documentDirectory}${filename}`;

      await fs.writeAsStringAsync(fileUri, content, {
        encoding: fs.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: 'Экспорт данных',
        });
      } else {
        Alert.alert('Успешно', `Файл сохранен: ${filename}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить файл');
    }
  };

  const handleShare = async () => {
    if (!exportData) return;

    try {
      const summary = `Экспорт данных HandShakeMe\n\nВсего записей:\n${Object.entries(exportData.summary)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}`;

      await Share.share({
        message: summary,
        title: 'Экспорт данных',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900">Экспорт данных</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Info Card */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-blue-900 mb-1">
                Право на портативность данных
              </Text>
              <Text className="text-xs text-blue-700">
                В соответствии с GDPR (Статья 20), вы можете экспортировать все свои данные в структурированном формате.
              </Text>
            </View>
          </View>

          {!exportData ? (
            <>
              {/* Format Selection */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Формат экспорта
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setFormat('json')}
                    className={`flex-1 py-3 rounded-lg border-2 ${format === 'json'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    <Text
                      className={`text-center font-medium ${format === 'json' ? 'text-blue-600' : 'text-gray-600'
                        }`}
                    >
                      JSON
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFormat('csv')}
                    className={`flex-1 py-3 rounded-lg border-2 ${format === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    <Text
                      className={`text-center font-medium ${format === 'csv' ? 'text-blue-600' : 'text-gray-600'
                        }`}
                    >
                      CSV
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Include Files */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <TouchableOpacity
                  onPress={() => setIncludeFiles(!includeFiles)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      Включить файлы
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Ссылки на загрузку файлов (действительны 24 часа)
                    </Text>
                  </View>
                  <View
                    className={`w-12 h-7 rounded-full ${includeFiles ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-1 ${includeFiles ? 'ml-6' : 'ml-1'
                        }`}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Sections Selection */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-semibold text-gray-900">
                    Разделы для экспорта
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity onPress={selectAll}>
                      <Text className="text-sm text-blue-600 font-medium">Все</Text>
                    </TouchableOpacity>
                    <Text className="text-gray-400">|</Text>
                    <TouchableOpacity onPress={deselectAll}>
                      <Text className="text-sm text-gray-600 font-medium">Очистить</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text className="text-xs text-gray-500 mb-3">
                  Оставьте пустым для экспорта всех данных
                </Text>

                {sections.map((section) => (
                  <TouchableOpacity
                    key={section.key}
                    onPress={() => toggleSection(section.key)}
                    className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <View
                      className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${selectedSections.includes(section.key)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}
                    >
                      {selectedSections.includes(section.key) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                      <Ionicons name={section.icon as any} size={20} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900">
                        {section.label}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {section.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Export Button */}
              <TouchableOpacity
                onPress={handleExport}
                disabled={loading}
                className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center shadow-sm"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="download" size={24} color="white" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Экспортировать данные
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Rate Limit Warning */}
              <View className="bg-yellow-50 rounded-xl p-4 mt-4 flex-row">
                <Ionicons name="time" size={20} color="#F59E0B" />
                <Text className="flex-1 ml-3 text-xs text-yellow-800">
                  Вы можете запрашивать экспорт не чаще 1 раза в час
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Export Success */}
              <View className="bg-green-50 rounded-xl p-6 mb-4 items-center">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                </View>
                <Text className="text-lg font-bold text-gray-900 mb-2">
                  Данные экспортированы
                </Text>
                <Text className="text-center text-sm text-gray-600 mb-4">
                  Экспортировано {exportData.exportInfo.exportedAt}
                </Text>
              </View>

              {/* Summary */}
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Сводка
                </Text>
                {Object.entries(exportData.summary).map(([key, value]) => (
                  <View
                    key={key}
                    className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-sm text-gray-600">{key}</Text>
                    <Text className="text-sm font-medium text-gray-900">{value}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleDownload}
                  className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="download" size={24} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Скачать файл
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShare}
                  className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="share" size={24} color="#6B7280" />
                  <Text className="text-gray-700 font-semibold text-base ml-2">
                    Поделиться
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setExportData(null)}
                  className="bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="refresh" size={24} color="#6B7280" />
                  <Text className="text-gray-700 font-semibold text-base ml-2">
                    Новый экспорт
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Retention Info */}
              <View className="bg-gray-50 rounded-xl p-4 mt-4">
                <Text className="text-xs text-gray-600 text-center">
                  {exportData.exportInfo.dataRetentionPolicy}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
