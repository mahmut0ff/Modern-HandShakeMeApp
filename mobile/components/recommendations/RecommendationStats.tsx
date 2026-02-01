import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RecommendationStats as Stats } from '../../services/recommendationsApi';

interface RecommendationStatsProps {
  stats: Stats;
}

export const RecommendationStats: React.FC<RecommendationStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.mainStat}>
        <Text style={styles.mainStatValue}>{stats.totalRecommendations}</Text>
        <Text style={styles.mainStatLabel}>Рекомендованных заказов</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
            <MaterialIcons name="trending-up" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats.averageScore}%</Text>
          <Text style={styles.statLabel}>Средний балл</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <MaterialIcons name="star" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{stats.highScoreCount}</Text>
          <Text style={styles.statLabel}>Отличных</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialIcons name="category" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{stats.sameCategory}</Text>
          <Text style={styles.statLabel}>Ваша категория</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
            <MaterialIcons name="location-city" size={20} color="#6366F1" />
          </View>
          <Text style={styles.statValue}>{stats.sameCityCount}</Text>
          <Text style={styles.statLabel}>Ваш город</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  mainStat: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
