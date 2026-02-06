import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../../store';
import { disputeApi, Dispute } from '../../../services/disputeApi';
import { DisputeCard } from '../components/DisputeCard';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { EmptyState } from '../../../components/EmptyState';

type FilterStatus = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const DisputesListScreen: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const loadDisputes = useCallback(async () => {
    if (!accessToken) return;

    try {
      setError(null);
      const data = await disputeApi.getDisputes(accessToken, {
        status: filter === 'ALL' ? undefined : filter
      });
      setDisputes(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить споры');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, filter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDisputes();
  };

  const handleDisputePress = (dispute: Dispute) => {
    router.push({
      pathname: '/(client)/disputes/[id]',
      params: { id: dispute.id }
    });
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'ALL', label: 'Все' },
    { key: 'OPEN', label: 'Открытые' },
    { key: 'IN_PROGRESS', label: 'В процессе' },
    { key: 'RESOLVED', label: 'Решенные' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Споры</Text>
      </View>

      {/* Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-full mr-2 ${
                filter === item.key ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <Text className={`font-medium ${
                filter === item.key ? 'text-white' : 'text-gray-600'
              }`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {error && <ErrorMessage message={error} onRetry={loadDisputes} />}

      <FlatList
        data={disputes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DisputeCard
            dispute={item}
            onPress={() => handleDisputePress(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="Нет споров"
            description="У вас пока нет открытых споров"
          />
        }
        contentContainerStyle={disputes.length === 0 ? { flex: 1 } : { padding: 16 }}
      />
    </SafeAreaView>
  );
};

export default DisputesListScreen;
