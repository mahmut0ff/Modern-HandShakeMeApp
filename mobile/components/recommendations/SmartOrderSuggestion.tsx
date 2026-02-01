import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RecommendedOrder } from '../../services/recommendationsApi';
import recommendationsApi from '../../services/recommendationsApi';

interface SmartOrderSuggestionProps {
  order: RecommendedOrder;
  onPress: () => void;
  onDismiss?: () => void;
}

/**
 * Compact suggestion card for showing personalized order recommendations
 * Can be used in dashboard, notifications, or as inline suggestions
 */
export const SmartOrderSuggestion: React.FC<SmartOrderSuggestionProps> = ({
  order,
  onPress,
  onDismiss,
}) => {
  const scoreInfo = recommendationsApi.getScoreLevel(order.matchScore);
  const budget = recommendationsApi.formatBudget(
    order.budgetType,
    order.budgetMin,
    order.budgetMax
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="auto-awesome" size={20} color="#F59E0B" />
          <Text style={styles.headerText}>Рекомендуем для вас</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {order.title}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreInfo.color }]}>
            <Text style={styles.scoreText}>{order.matchScore}%</Text>
          </View>
        </View>

        {order.category && (
          <View style={styles.categoryRow}>
            <MaterialIcons name="category" size={14} color="#6B7280" />
            <Text style={styles.categoryText}>{order.category.name}</Text>
          </View>
        )}

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{order.city}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="attach-money" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{budget}</Text>
          </View>
        </View>

        {/* Top reason */}
        {order.reasons && order.reasons.length > 0 && (
          <View style={styles.reasonContainer}>
            <MaterialIcons name="check-circle" size={14} color="#10B981" />
            <Text style={styles.reasonText} numberOfLines={1}>
              {order.reasons[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Нажмите, чтобы откликнуться</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FEF3C7',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  content: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
  },
});
