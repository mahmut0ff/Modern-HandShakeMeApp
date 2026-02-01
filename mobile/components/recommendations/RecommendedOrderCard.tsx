import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RecommendedOrder } from '../../services/recommendationsApi';
import recommendationsApi from '../../services/recommendationsApi';

interface RecommendedOrderCardProps {
  order: RecommendedOrder;
  showReasons?: boolean;
  onPress: () => void;
  onApply: () => void;
}

export const RecommendedOrderCard: React.FC<RecommendedOrderCardProps> = ({
  order,
  showReasons = true,
  onPress,
  onApply,
}) => {
  const scoreInfo = recommendationsApi.getScoreLevel(order.matchScore);
  const urgencyInfo = recommendationsApi.getUrgencyLevel(order.daysUntilExpiry);
  const budget = recommendationsApi.formatBudget(
    order.budgetType,
    order.budgetMin,
    order.budgetMax
  );
  const topReasons = recommendationsApi.getTopReasons(order.reasons, 3);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header with match score */}
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBadge, { backgroundColor: scoreInfo.color }]}>
            <Text style={styles.scoreText}>{order.matchScore}%</Text>
          </View>
          <Text style={[styles.scoreLabel, { color: scoreInfo.color }]}>
            {scoreInfo.label}
          </Text>
        </View>

        {urgencyInfo.level !== 'normal' && (
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyInfo.color }]}>
            <MaterialIcons name="schedule" size={14} color="#FFF" />
            <Text style={styles.urgencyText}>{urgencyInfo.label}</Text>
          </View>
        )}
      </View>

      {/* Title and Category */}
      <Text style={styles.title} numberOfLines={2}>
        {order.title}
      </Text>

      {order.category && (
        <View style={styles.categoryContainer}>
          <MaterialIcons name="category" size={14} color="#6B7280" />
          <Text style={styles.categoryText}>{order.category.name}</Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {order.description}
      </Text>

      {/* Reasons */}
      {showReasons && topReasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>Почему подходит:</Text>
          {topReasons.map((reason, index) => (
            <View key={index} style={styles.reasonItem}>
              <MaterialIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{order.city}</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="attach-money" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{budget}</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{order.applicationsCount} откликов</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={14} color="#6B7280" />
          <Text style={styles.dateText}>
            {new Date(order.startDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>Откликнуться</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonsContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    lineHeight: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
