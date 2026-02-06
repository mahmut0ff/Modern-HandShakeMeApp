import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RecommendedOrder } from '../../services/recommendationsApi';
import { RecommendedOrderCard } from '../../components/recommendations/RecommendedOrderCard';
import { RecommendationStats } from '../../components/recommendations/RecommendationStats';
import { RecommendationFilters } from '../../components/recommendations/RecommendationFilters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';


type FilterType = 'all' | 'excellent' | 'good' | 'fair';

export const RecommendedOrdersScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showReasons, setShowReasons] = useState(true);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendedOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    recommendations,
    stats,
    loading,
    error,
    refresh: loadRecommendations // Alias refresh to loadRecommendations for compatibility
  } = useRecommendations({
    limit: 50,
    includeReasons: showReasons,
  });

  useEffect(() => {
    applyFilter(activeFilter);
  }, [recommendations, activeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const applyFilter = (filter: FilterType) => {
    let filtered = [...recommendations];

    switch (filter) {
      case 'excellent':
        filtered = filtered.filter((r) => r.matchScore >= 80);
        break;
      case 'good':
        filtered = filtered.filter((r) => r.matchScore >= 60 && r.matchScore < 80);
        break;
      case 'fair':
        filtered = filtered.filter((r) => r.matchScore >= 40 && r.matchScore < 60);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredRecommendations(filtered);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleOrderPress = (orderId: string) => {
    // Navigate to order details
    console.log('Navigate to order:', orderId);
  };

  const handleApply = (orderId: string) => {
    // Navigate to application form
    console.log('Apply to order:', orderId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
        <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Рекомендации</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            /* Show info modal */
          }}
        >
          <MaterialIcons name="info-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats */}
        {stats && <RecommendationStats stats={stats} />}

        {/* Filters */}
        <RecommendationFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={{
            all: recommendations.length,
            excellent: recommendations.filter((r) => r.matchScore >= 80).length,
            good: recommendations.filter((r) => r.matchScore >= 60 && r.matchScore < 80).length,
            fair: recommendations.filter((r) => r.matchScore >= 40 && r.matchScore < 60).length,
          }}
        />

        {/* Recommendations List */}
        <View style={styles.listContainer}>
          {filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((order) => (
              <RecommendedOrderCard
                key={order.id}
                order={order}
                showReasons={showReasons}
                onPress={() => handleOrderPress(order.id)}
                onApply={() => handleApply(order.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>
                {activeFilter === 'all'
                  ? 'Нет рекомендованных заказов'
                  : 'Нет заказов с выбранным уровнем совпадения'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Попробуйте обновить список или изменить фильтр
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        {recommendations.length > 0 && (
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                Заказы с высоким совпадением (80%+) идеально подходят под ваш профиль
              </Text>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
              <Text style={styles.tipText}>
                Откликайтесь быстрее на срочные заказы для повышения шансов
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  infoButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
