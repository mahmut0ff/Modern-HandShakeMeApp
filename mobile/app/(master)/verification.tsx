import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { 
  useGetVerificationStatusQuery, 
  useUploadVerificationDocumentMutation,
  useSubmitForReviewMutation 
} from '../../services/verificationApi'
import { safeNavigate } from '../../hooks/useNavigation'

type DocumentType = 'passport' | 'selfie'

interface UploadedDoc {
  type: DocumentType
  uri: string
  uploaded: boolean
}

export default function VerificationScreen() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const { data: verificationStatus, refetch } = useGetVerificationStatusQuery()
  const [uploadDocument] = useUploadVerificationDocumentMutation()
  const [submitForReview] = useSubmitForReviewMutation()
  
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'passport' | 'selfie' | 'review'>('passport')

  const passportDoc = documents.find(d => d.type === 'passport')
  const selfieDoc = documents.find(d => d.type === 'selfie')
  
  // Check if already verified or in review
  const isVerified = verificationStatus?.overall_status === 'verified'
  const isInReview = verificationStatus?.overall_status === 'in_review'

  const pickImage = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужен доступ к камере для загрузки документов')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'passport' ? [4, 3] : [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const newDoc: UploadedDoc = {
        type,
        uri: result.assets[0].uri,
        uploaded: false,
      }
      
      setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc])
      
      if (type === 'passport') {
        setStep('selfie')
      } else {
        setStep('review')
      }
    }
  }

  const handleSubmit = async () => {
    if (!passportDoc || !selfieDoc) {
      Alert.alert('Ошибка', 'Загрузите оба документа')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload passport
      const passportFormData = new FormData()
      passportFormData.append('file', {
        uri: passportDoc.uri,
        type: 'image/jpeg',
        name: `passport_${Date.now()}.jpg`,
      } as any)
      
      await uploadDocument({ documentType: 'PASSPORT', file: passportFormData }).unwrap()

      // Upload selfie as OTHER type
      const selfieFormData = new FormData()
      selfieFormData.append('file', {
        uri: selfieDoc.uri,
        type: 'image/jpeg',
        name: `selfie_${Date.now()}.jpg`,
      } as any)
      
      await uploadDocument({ documentType: 'OTHER', file: selfieFormData }).unwrap()

      // Submit for review
      await submitForReview({}).unwrap()
      
      // Refetch status
      await refetch()

      Alert.alert(
        'Успешно!',
        'Документы отправлены на проверку. Обычно это занимает 1-2 рабочих дня.',
        [{ text: 'OK', onPress: () => safeNavigate.back() }]
      )
    } catch (error: any) {
      console.error('Submit error:', error)
      Alert.alert('Ошибка', error.data?.message || 'Не удалось отправить документы. Попробуйте позже.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Show verified status
  if (isVerified) {
    return (
      <View className="flex-1 bg-gray-100">
        <StatusBar style="dark" />
        <ScrollView className="flex-1 px-4 pt-12">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Верификация</Text>
          </View>
          
          <View className="bg-white rounded-2xl p-6 items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Верификация пройдена!
            </Text>
            <Text className="text-gray-600 text-center">
              Ваша личность подтверждена. Вы можете получать заказы без ограничений.
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }
  
  // Show in review status
  if (isInReview) {
    return (
      <View className="flex-1 bg-gray-100">
        <StatusBar style="dark" />
        <ScrollView className="flex-1 px-4 pt-12">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Верификация</Text>
          </View>
          
          <View className="bg-white rounded-2xl p-6 items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="time" size={48} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Документы на проверке
            </Text>
            <Text className="text-gray-600 text-center">
              Мы проверяем ваши документы. Обычно это занимает 1-2 рабочих дня.
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  const renderPassportStep = () => (
    <View className="flex-1">
      <View className="bg-white rounded-2xl p-6 mb-4">
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="id-card" size={40} color="#3B82F6" />
          </View>
          <Text className="text-xl font-bold text-gray-900 text-center">
            Фото паспорта
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Сфотографируйте разворот паспорта с вашим фото
          </Text>
        </View>

        <View className="bg-amber-50 p-4 rounded-xl mb-6">
          <Text className="text-amber-800 text-sm">
            ⚠️ Убедитесь, что:
          </Text>
          <Text className="text-amber-700 text-sm mt-2">• Все данные хорошо читаемы</Text>
          <Text className="text-amber-700 text-sm">• Фото не размыто</Text>
          <Text className="text-amber-700 text-sm">• Нет бликов и теней</Text>
        </View>

        {passportDoc ? (
          <View className="items-center">
            <Image 
              source={{ uri: passportDoc.uri }} 
              className="w-full h-48 rounded-xl mb-4"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => pickImage('passport')}
              className="flex-row items-center"
            >
              <Ionicons name="refresh" size={20} color="#3B82F6" />
              <Text className="text-blue-500 ml-2">Переснять</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => pickImage('passport')}
            className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text className="text-white font-bold ml-2">Сделать фото</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderSelfieStep = () => (
    <View className="flex-1">
      <View className="bg-white rounded-2xl p-6 mb-4">
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="person-circle" size={40} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-gray-900 text-center">
            Селфи с документом
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Сделайте фото, держа паспорт рядом с лицом
          </Text>
        </View>

        <View className="bg-blue-50 p-4 rounded-xl mb-6">
          <Text className="text-blue-800 text-sm">
            📸 Советы для хорошего фото:
          </Text>
          <Text className="text-blue-700 text-sm mt-2">• Лицо и документ должны быть видны</Text>
          <Text className="text-blue-700 text-sm">• Хорошее освещение</Text>
          <Text className="text-blue-700 text-sm">• Смотрите в камеру</Text>
        </View>

        {selfieDoc ? (
          <View className="items-center">
            <Image 
              source={{ uri: selfieDoc.uri }} 
              className="w-48 h-48 rounded-full mb-4"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => pickImage('selfie')}
              className="flex-row items-center"
            >
              <Ionicons name="refresh" size={20} color="#3B82F6" />
              <Text className="text-blue-500 ml-2">Переснять</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => pickImage('selfie')}
            className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text className="text-white font-bold ml-2">Сделать селфи</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => setStep('passport')}
        className="py-3"
      >
        <Text className="text-gray-600 text-center">← Вернуться к паспорту</Text>
      </TouchableOpacity>
    </View>
  )

  const renderReviewStep = () => (
    <View className="flex-1">
      <View className="bg-white rounded-2xl p-6 mb-4">
        <Text className="text-xl font-bold text-gray-900 text-center mb-6">
          Проверьте документы
        </Text>

        <View className="flex-row mb-6">
          <View className="flex-1 mr-2">
            <Text className="text-sm text-gray-600 mb-2 text-center">Паспорт</Text>
            {passportDoc && (
              <Image 
                source={{ uri: passportDoc.uri }} 
                className="w-full h-32 rounded-xl"
                resizeMode="cover"
              />
            )}
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-sm text-gray-600 mb-2 text-center">Селфи</Text>
            {selfieDoc && (
              <Image 
                source={{ uri: selfieDoc.uri }} 
                className="w-full h-32 rounded-xl"
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        <View className="bg-gray-50 p-4 rounded-xl mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text className="text-gray-900 font-medium ml-2">Безопасность данных</Text>
          </View>
          <Text className="text-gray-600 text-sm">
            Ваши документы будут использованы только для верификации и надёжно защищены
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-xl flex-row items-center justify-center ${
            isSubmitting ? 'bg-gray-400' : 'bg-blue-500'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold ml-2">Отправить на проверку</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setStep('selfie')}
        className="py-3"
      >
        <Text className="text-gray-600 text-center">← Изменить фото</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1 px-4 pt-12" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Верификация</Text>
            <Text className="text-gray-600 text-sm">Подтверждение личности</Text>
          </View>
        </View>

        {/* Progress */}
        <View className="flex-row mb-6">
          <View className={`flex-1 h-1 rounded-full mx-1 ${step === 'passport' || step === 'selfie' || step === 'review' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <View className={`flex-1 h-1 rounded-full mx-1 ${step === 'selfie' || step === 'review' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <View className={`flex-1 h-1 rounded-full mx-1 ${step === 'review' ? 'bg-blue-500' : 'bg-gray-300'}`} />
        </View>

        {step === 'passport' && renderPassportStep()}
        {step === 'selfie' && renderSelfieStep()}
        {step === 'review' && renderReviewStep()}
      </ScrollView>
    </View>
  )
}
