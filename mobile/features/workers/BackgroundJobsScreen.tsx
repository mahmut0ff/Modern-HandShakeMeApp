import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import backgroundJobsHelpers, { BackgroundJob, useGetJobsQuery, useCancelJobMutation, useRetryJobMutation, useTriggerRatingCalculationMutation, useTriggerRecommendationGenerationMutation } from '../../services/backgroundJobsApi';
import { BackgroundJobIndicator } from '../../components/workers/BackgroundJobIndicator';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

type FilterType = 'all' | 'active' | 'completed' | 'failed';

export const BackgroundJobsScreen: React.FC = () => {
  const { data: jobsData, isLoading: loading, error: queryError, refetch } = useGetJobsQuery({ limit: 50 }, { pollingInterval: 5000 });
  const [cancelJob] = useCancelJobMutation();
  const [retryJob] = useRetryJobMutation();
  const [triggerRating] = useTriggerRatingCalculationMutation();
  const [triggerRecs] = useTriggerRecommendationGenerationMutation();

  const jobs = jobsData?.jobs || [];
  const stats = {
    activeCount: jobsData?.activeCount || 0,
    completedCount: jobsData?.completedCount || 0,
    failedCount: jobsData?.failedCount || 0,
  };

  const [filteredJobs, setFilteredJobs] = useState<BackgroundJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    applyFilter(activeFilter);
  }, [jobs, activeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const applyFilter = (filter: FilterType) => {
    let filtered = [...jobs];

    switch (filter) {
      case 'active':
        filtered = filtered.filter((j) => backgroundJobsHelpers.isJobActive(j.status));
        break;
      case 'completed':
        filtered = filtered.filter((j) => j.status === 'COMPLETED');
        break;
      case 'failed':
        filtered = filtered.filter((j) => j.status === 'FAILED');
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleJobPress = (job: BackgroundJob) => {
    const statusInfo = backgroundJobsHelpers.getJobStatusInfo(job.status);
    const canCancel = backgroundJobsHelpers.canCancelJob(job.status);
    const canRetry = backgroundJobsHelpers.canRetryJob(job.status);

    const buttons: any[] = [];

    if (canCancel) {
      buttons.push({
        text: 'Отменить',
        style: 'destructive',
        onPress: () => handleCancelJob(job.id),
      });
    }

    if (canRetry) {
      buttons.push({
        text: 'Повторить',
        onPress: () => handleRetryJob(job.id),
      });
    }

    buttons.push({ text: 'Закрыть', style: 'cancel' });

    Alert.alert(job.title, `Статус: ${statusInfo.label}`, buttons);
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId).unwrap();
    } catch (err: any) {
      Alert.alert('Ошибка', 'Не удалось отменить задачу');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryJob(jobId).unwrap();
    } catch (err: any) {
      Alert.alert('Ошибка', 'Не удалось повторить задачу');
    }
  };

  const handleTriggerRatingCalculation = async () => {
    try {
      await triggerRating().unwrap();
      Alert.alert('Успех', 'Расчет рейтинга запущен');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Ошибка запуска');
    }
  };

  const handleTriggerRecommendations = async () => {
    try {
      await triggerRecs().unwrap();
      Alert.alert('Успех', 'Генерация рекомендаций запущена');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Ошибка запуска');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const error = queryError ? 'Не удалось загрузить задачи' : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Фоновые задачи</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="sync" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.activeCount}</Text>
            <Text style={styles.statLabel}>Активных</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Завершено</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="error" size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.failedCount}</Text>
            <Text style={styles.statLabel}>Ошибок</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'active', 'completed', 'failed'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter === 'all'
                    ? 'Все'
                    : filter === 'active'
                      ? 'Активные'
                      : filter === 'completed'
                        ? 'Завершенные'
                        : 'С ошибками'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {error && <ErrorMessage message={error} />}

        {/* Jobs List */}
        <View style={styles.listContainer}>
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <BackgroundJobIndicator
                key={job.id}
                job={job}
                onPress={() => handleJobPress(job)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="work-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>
                {activeFilter === 'all' ? 'Нет фоновых задач' : 'Нет задач с выбранным статусом'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Быстрые действия</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleTriggerRatingCalculation}>
            <MaterialIcons name="star" size={20} color="#F59E0B" />
            <Text style={styles.actionButtonText}>Пересчитать рейтинг</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleTriggerRecommendations}>
            <MaterialIcons name="auto-awesome" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Обновить рекомендации</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  actionsContainer: {
    padding: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});
