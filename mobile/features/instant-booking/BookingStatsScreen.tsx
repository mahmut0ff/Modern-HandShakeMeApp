import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useGetBookingStatsQuery } from '../../services/instantBookingApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

const { width } = Dimensions.get('window');

type Period = 'week' | 'month' | 'year';
type Role = 'client' | 'master';

export const BookingStatsScreen: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [role, setRole] = useState<Role>('master');

  const { data: stats, isLoading, error } = useGetBookingStatsQuery({ role, period });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} сом`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  };

  const getCompletionRate = () => {
    if (!stats || stats.totalBookings === 0) return 0;
    return Math.round((stats.completedBookings / stats.totalBookings) * 100);
  };

  const getCancellationRate = () => {
    if (!stats || stats.totalBookings === 0) return 0;
    return Math.round((stats.cancelledBookings / stats.totalBookings) * 100);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Не удалось загрузить статистику" />;
  }

  if (!stats) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role Selector */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'master' && styles.roleButtonActive]}
            onPress={() => setRole('master')}
          >
            <MaterialIcons
              name="work"
              size={20}
              color={role === 'master' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[styles.roleButtonText, role === 'master' && styles.roleButtonTextActive]}
            >
              Как мастер
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
            onPress={() => setRole('client')}
          >
            <MaterialIcons
              name="person"
              size={20}
              color={role === 'client' ? '#3B82F6' : '#6B7280'}
            />
            <Text
              style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}
            >
              Как клиент
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.mainStatCard}>
            <MaterialIcons name="event" size={32} color="#3B82F6" />
            <Text style={styles.mainStatValue}>{stats.totalBookings}</Text>
            <Text style={styles.mainStatLabel}>Всего бронирований</Text>
          </View>

          <View style={styles.mainStatCard}>
            <MaterialIcons name="attach-money" size={32} color="#10B981" />
            <Text style={styles.mainStatValue}>{formatCurrency(stats.totalEarnings)}</Text>
            <Text style={styles.mainStatLabel}>
              {role === 'master' ? 'Заработано' : 'Потрачено'}
            </Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>Завершено</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${getCompletionRate()}%`, backgroundColor: '#10B981' }]}
              />
            </View>
            <Text style={styles.statPercentage}>{getCompletionRate()}%</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="cancel" size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats.cancelledBookings}</Text>
            <Text style={styles.statLabel}>Отменено</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${getCancellationRate()}%`, backgroundColor: '#EF4444' }]}
              />
            </View>
            <Text style={styles.statPercentage}>{getCancellationRate()}%</Text>
          </View>

          {role === 'master' && (
            <>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="star" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Средний рейтинг</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                      key={star}
                      name={star <= Math.round(stats.averageRating) ? 'star' : 'star-border'}
                      size={16}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialIcons name="schedule" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{formatTime(stats.responseTime)}</Text>
                <Text style={styles.statLabel}>Время отклика</Text>
                <Text style={styles.statSubtext}>
                  {stats.responseTime < 60 ? 'Отлично' : stats.responseTime < 120 ? 'Хорошо' : 'Средне'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Аналитика</Text>

          {getCompletionRate() >= 90 && (
            <View style={styles.insightCard}>
              <MaterialIcons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.insightText}>
                Отличный показатель завершенных бронирований! Продолжайте в том же духе.
              </Text>
            </View>
          )}

          {getCancellationRate() > 20 && (
            <View style={styles.insightCard}>
              <MaterialIcons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.insightText}>
                Высокий процент отмен. Рекомендуем пересмотреть политику отмены.
              </Text>
            </View>
          )}

          {role === 'master' && stats.responseTime > 120 && (
            <View style={styles.insightCard}>
              <MaterialIcons name="info" size={20} color="#3B82F6" />
              <Text style={styles.insightText}>
                Улучшите время отклика для повышения рейтинга и привлечения клиентов.
              </Text>
            </View>
          )}

          {stats.totalBookings === 0 && (
            <View style={styles.insightCard}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#6B7280" />
              <Text style={styles.insightText}>
                Пока нет бронирований. Начните с настройки профиля и добавления услуг.
              </Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFF',
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#3B82F6',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  mainStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  insightsContainer: {
    padding: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
