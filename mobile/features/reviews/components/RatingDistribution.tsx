import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RatingStars } from './RatingStars';
import Colors from '../../../constants/Colors';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface RatingDistributionProps {
  stats: ReviewStats;
  onRatingTap?: (rating: number) => void;
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  stats,
  onRatingTap,
}) => {
  const { averageRating, totalReviews, distribution } = stats;

  const calculatePercentage = (count: number): number => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const renderDistributionBar = (rating: number) => {
    const count = distribution[rating as keyof typeof distribution];
    const percentage = calculatePercentage(count);

    const BarComponent = onRatingTap ? TouchableOpacity : View;

    return (
      <BarComponent
        key={rating}
        style={styles.distributionRow}
        onPress={onRatingTap ? () => onRatingTap(rating) : undefined}
        activeOpacity={0.7}
      >
        <Text style={styles.ratingLabel}>{rating}</Text>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: getBarColor(rating),
              },
            ]}
          />
        </View>
        <Text style={styles.countText}>{count}</Text>
        <Text style={styles.percentageText}>({percentage.toFixed(0)}%)</Text>
      </BarComponent>
    );
  };

  const getBarColor = (rating: number): string => {
    if (rating === 5) return Colors.yellow[500];
    if (rating === 4) return Colors.yellow[600];
    if (rating === 3) return Colors.warning;
    if (rating === 2) return Colors.yellow[700];
    return Colors.red[500];
  };

  return (
    <View style={styles.container}>
      <View style={styles.summarySection}>
        <View style={styles.averageContainer}>
          <Text style={styles.averageRating}>
            {averageRating.toFixed(1)}
          </Text>
          <RatingStars rating={averageRating} size="medium" />
          <Text style={styles.totalReviews}>
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </View>

      <View style={styles.distributionSection}>
        {[5, 4, 3, 2, 1].map((rating) => renderDistributionBar(rating))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 8,
  },
  distributionSection: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    width: 12,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
    width: 40,
    textAlign: 'right',
  },
  percentageText: {
    fontSize: 12,
    color: Colors.gray[600],
    width: 50,
    textAlign: 'right',
  },
});
