import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../../store';
import { disputeApi, Dispute, DisputeMessage } from '../../../services/disputeApi';
import { DisputeDetails } from '../components/DisputeDetails';
import { DisputeMessages } from '../components/DisputeMessages';
import { DisputeActions } from '../components/DisputeActions';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';

export const DisputeDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const loadDispute = useCallback(async () => {
    if (!accessToken || !id) return;

    try {
      setError(null);
      const [disputeData, messagesData] = await Promise.all([
        disputeApi.getDispute(accessToken, id),
        disputeApi.getDisputeMessages(accessToken, id)
      ]);
      setDispute(disputeData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить спор');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDispute();
  };

  const handleSendMessage = async (content: string) => {
    if (!accessToken || !id) return;

    try {
      const newMessage = await disputeApi.sendDisputeMessage(accessToken, id, content);
      setMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось отправить сообщение');
    }
  };

  const handleAcceptResolution = async () => {
    if (!accessToken || !id) return;

    Alert.alert(
      'Принять решение',
      'Вы уверены, что хотите принять предложенное решение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          onPress: async () => {
            try {
              await disputeApi.acceptResolution(accessToken, id);
              loadDispute();
              Alert.alert('Успешно', 'Решение принято');
            } catch (err: any) {
              Alert.alert('Ошибка', err.message || 'Не удалось принять решение');
            }
          }
        }
      ]
    );
  };

  const handleEscalate = async () => {
    if (!accessToken || !id) return;

    Alert.alert(
      'Эскалация',
      'Вы хотите передать спор на рассмотрение администрации?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Эскалировать',
          style: 'destructive',
          onPress: async () => {
            try {
              await disputeApi.escalateDispute(accessToken, id);
              loadDispute();
              Alert.alert('Успешно', 'Спор передан администрации');
            } catch (err: any) {
              Alert.alert('Ошибка', err.message || 'Не удалось эскалировать спор');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dispute) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Спор не найден</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            Спор #{dispute.id.slice(0, 8)}
          </Text>
          <Text className="text-sm text-gray-500">{dispute.status}</Text>
        </View>
      </View>

      {error && <ErrorMessage message={error} onRetry={loadDispute} />}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Dispute Details */}
        <DisputeDetails dispute={dispute} />

        {/* Messages */}
        <DisputeMessages
          messages={messages}
          currentUserId={user?.id?.toString() || ''}
          onSendMessage={handleSendMessage}
        />
      </ScrollView>

      {/* Actions */}
      {dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED' && (
        <DisputeActions
          dispute={dispute}
          onAcceptResolution={handleAcceptResolution}
          onEscalate={handleEscalate}
        />
      )}
    </SafeAreaView>
  );
};

export default DisputeDetailScreen;
