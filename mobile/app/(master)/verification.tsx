import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useGetVerificationStatusQuery,
  useGetVerificationDocumentsQuery,
  useGetVerificationRequirementsQuery,
  useUploadVerificationDocumentMutation,
  useSubmitForReviewMutation,
  useDeleteVerificationDocumentMutation,
  type VerificationDocument,
  type VerificationRequirement,
} from '../../services/verificationApi';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  required: boolean;
  icon: string;
  document?: VerificationDocument;
}

export default function MasterVerificationPage() {
  const [selectedImages, setSelectedImages] = useState<{[key: string]: string}>({});

  // API queries
  const { 
    data: statusData, 
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus 
  } = useGetVerificationStatusQuery();

  const { 
    data: documentsData, 
    isLoading: documentsLoading,
    refetch: refetchDocuments 
  } = useGetVerificationDocumentsQuery();

  const { 
    data: requirementsData, 
    isLoading: requirementsLoading 
  } = useGetVerificationRequirementsQuery();

  // Mutations
  const [uploadDocumentMutation, { isLoading: uploadLoading }] = useUploadVerificationDocumentMutation();
  const [submitForReview, { isLoading: submitLoading }] = useSubmitForReviewMutation();
  const [deleteDocument] = useDeleteVerificationDocumentMutation();

  const documents = documentsData || [];
  const requirements = requirementsData || [];
  const status = statusData;

  // Create verification steps from requirements and documents
  const verificationSteps: VerificationStep[] = requirements.map(req => {
    const document = documents.find(doc => doc.document_type === req.document_type);
    return {
      id: req.document_type,
      title: req.title,
      description: req.description,
      status: document?.status || 'pending',
      required: req.is_required,
      icon: req.icon,
      document,
    };
  });

  const overallStatus = status?.overall_status || 'unverified';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' };
      case 'in_review': return { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'time' };
      case 'rejected': return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'ellipse-outline' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Одобрено';
      case 'in_review': return 'На проверке';
      case 'rejected': return 'Отклонено';
      default: return 'Ожидает';
    }
  };

  const pickImage = async (stepId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocumentFile(stepId, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const takePhoto = async (stepId: string) => {
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
        await uploadDocumentFile(stepId, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const uploadDocumentFile = async (documentType: string, fileUri: string) => {
    try {
      const requirement = requirements.find(req => req.document_type === documentType);
      if (!requirement) return;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: `${documentType}.jpg`,
      } as any);
      formData.append('document_type', documentType);
      formData.append('title', requirement.title);
      formData.append('description', requirement.description);

      await uploadDocumentMutation({
        document_type: documentType,
        title: requirement.title,
        description: requirement.description,
        file: formData,
      }).unwrap();

      setSelectedImages(prev => ({
        ...prev,
        [documentType]: fileUri
      }));

      refetchDocuments();
      refetchStatus();
      
      Alert.alert('Успех', 'Документ загружен и отправлен на проверку');
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось загрузить документ');
    }
  };

  const uploadDocument = (stepId: string) => {
    Alert.alert(
      'Загрузить документ',
      'Выберите способ загрузки',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Галерея', onPress: () => pickImage(stepId) },
        { text: 'Камера', onPress: () => takePhoto(stepId) }
      ]
    );
  };

  const handleSubmitForReview = async () => {
    const requiredSteps = verificationSteps.filter(step => step.required);
    const completedRequired = requiredSteps.filter(step => 
      step.status === 'approved' || step.status === 'in_review'
    );

    if (completedRequired.length < requiredSteps.length) {
      Alert.alert('Внимание', 'Заполните все обязательные поля для верификации');
      return;
    }

    try {
      await submitForReview().unwrap();
      refetchStatus();
      Alert.alert('Успех', 'Документы отправлены на проверку');
    } catch (error: any) {
      console.error('Failed to submit for review:', error);
      Alert.alert('Ошибка', error?.data?.message || 'Не удалось отправить документы');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    Alert.alert(
      'Удалить документ',
      'Вы уверены, что хотите удалить этот документ?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(documentId).unwrap();
              refetchDocuments();
              refetchStatus();
              Alert.alert('Успех', 'Документ удален');
            } catch (error: any) {
              console.error('Failed to delete document:', error);
              Alert.alert('Ошибка', 'Не удалось удалить документ');
            }
          }
        }
      ]
    );
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
          <Text className="text-2xl font-bold text-gray-900">Верификация</Text>
        </View>

        {/* Loading state */}
        {(statusLoading || documentsLoading || requirementsLoading) && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <ActivityIndicator size="large" color="#0165FB" />
            <Text className="text-gray-500 mt-2">Загрузка данных верификации...</Text>
          </View>
        )}

        {/* Error state */}
        {statusError && (
          <View className="bg-white rounded-3xl p-8 items-center shadow-sm border border-gray-100 mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-gray-900 font-semibold mb-2">Ошибка загрузки</Text>
            <Text className="text-gray-500 text-center mb-4">
              Не удалось загрузить данные верификации
            </Text>
            <TouchableOpacity 
              onPress={() => refetchStatus()}
              className="bg-[#0165FB] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Повторить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overall Status */}
        {!statusLoading && !statusError && status && (
          <View className={`rounded-3xl p-5 mb-6 ${
            overallStatus === 'verified' ? 'bg-green-500' :
            overallStatus === 'in_review' ? 'bg-orange-500' : 'bg-[#0165FB]'
          }`}>
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                <Ionicons 
                  name={
                    overallStatus === 'verified' ? 'shield-checkmark' :
                    overallStatus === 'in_review' ? 'shield-half' : 'shield'
                  } 
                  size={32} 
                  color="white" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  {overallStatus === 'verified' ? 'Верифицирован' :
                   overallStatus === 'in_review' ? 'На проверке' : 'Требуется верификация'}
                </Text>
                <Text className="text-white/80 text-sm">
                  {overallStatus === 'verified' 
                    ? 'Ваш аккаунт полностью верифицирован'
                    : overallStatus === 'in_review'
                    ? 'Документы проверяются модераторами'
                    : 'Пройдите верификацию для повышения доверия'
                  }
                </Text>
                <Text className="text-white/60 text-xs mt-1">
                  Документов: {status.approved_documents_count}/{status.documents_count}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Benefits */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Преимущества верификации</Text>
          <View className="space-y-3">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text className="text-gray-700">Повышенное доверие клиентов</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text className="text-gray-700">Приоритет в поиске</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text className="text-gray-700">Доступ к премиум заказам</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text className="text-gray-700">Значок "Проверенный мастер"</Text>
            </View>
          </View>
        </View>

        {/* Verification Steps */}
        {!statusLoading && !documentsLoading && !requirementsLoading && (
          <View className="space-y-4 mb-6">
            {verificationSteps.map((step) => {
              const statusStyle = getStatusColor(step.status);
              const hasImage = selectedImages[step.id] || step.document?.file_url;
              
              return (
                <View key={step.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-start gap-4">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                      step.status === 'approved' ? 'bg-green-100' :
                      step.status === 'in_review' ? 'bg-orange-100' :
                      step.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <Ionicons 
                        name={step.icon as any} 
                        size={24} 
                        color={
                          step.status === 'approved' ? '#059669' :
                          step.status === 'in_review' ? '#F59E0B' :
                          step.status === 'rejected' ? '#EF4444' : '#6B7280'
                        } 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-semibold text-gray-900">{step.title}</Text>
                        {step.required && (
                          <View className="px-2 py-1 bg-red-100 rounded-full">
                            <Text className="text-xs font-medium text-red-700">Обязательно</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className="text-sm text-gray-600 mb-3">{step.description}</Text>
                      
                      {step.status === 'rejected' && step.document?.rejection_reason && (
                        <View className="bg-red-50 p-3 rounded-2xl mb-3">
                          <Text className="text-sm text-red-700">
                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                            {' '}Причина отклонения: {step.document.rejection_reason}
                          </Text>
                        </View>
                      )}
                      
                      <View className="flex-row items-center justify-between">
                        <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name={statusStyle.icon as any} size={14} color={statusStyle.text.replace('text-', '#')} />
                            <Text className={`text-xs font-medium ${statusStyle.text}`}>
                              {getStatusText(step.status)}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row gap-2">
                          {step.status !== 'approved' && (
                            <TouchableOpacity
                              onPress={() => uploadDocument(step.id)}
                              disabled={uploadLoading}
                              className={`px-4 py-2 rounded-xl ${
                                uploadLoading ? 'bg-gray-400' : 'bg-[#0165FB]'
                              }`}
                            >
                              <Text className="text-white text-sm font-medium">
                                {uploadLoading ? 'Загрузка...' : hasImage ? 'Изменить' : 'Загрузить'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          {step.document && (
                            <TouchableOpacity
                              onPress={() => handleDeleteDocument(step.document!.id)}
                              className="px-3 py-2 bg-red-100 rounded-xl"
                            >
                              <Ionicons name="trash" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      {hasImage && (
                        <View className="mt-3">
                          <Image 
                            source={{ uri: step.document?.file_url || selectedImages[step.id] }} 
                            className="w-full h-32 rounded-2xl"
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Submit Button */}
        {!statusLoading && overallStatus !== 'verified' && verificationSteps.length > 0 && (
          <TouchableOpacity
            onPress={handleSubmitForReview}
            disabled={submitLoading}
            className={`py-4 rounded-2xl shadow-lg mb-6 ${
              submitLoading ? 'bg-gray-400' : 'bg-[#0165FB]'
            }`}
          >
            <Text className="text-center font-semibold text-white text-lg">
              {submitLoading ? 'Отправка...' : 'Отправить на проверку'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Help */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="font-semibold text-gray-900 mb-3 flex-row items-center gap-2">
            <Ionicons name="help-circle" size={20} color="#0165FB" />
            Нужна помощь?
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Если у вас возникли вопросы по верификации, обратитесь в службу поддержки.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(master)/settings/support')}
            className="flex-row items-center gap-2 py-3 px-4 bg-gray-50 rounded-2xl"
          >
            <Ionicons name="chatbubbles" size={16} color="#0165FB" />
            <Text className="text-[#0165FB] font-medium">Связаться с поддержкой</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}