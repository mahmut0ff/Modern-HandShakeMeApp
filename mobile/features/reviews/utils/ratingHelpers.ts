/**
 * Rating Helper Functions
 * Utilities for rating calculations and validation
 */

import { ReviewStats } from '../components/RatingDistribution';

/**
 * Validate rating value (must be 1-5)
 */
export const validateRating = (rating: number): { valid: boolean; error?: string } => {
  if (!Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be a whole number' };
  }

  if (rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }

  return { valid: true };
};

/**
 * Calculate average rating from an array of ratings
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / ratings.length;

  // Round to one decimal place
  return Math.round(average * 10) / 10;
};

/**
 * Calculate rating distribution from an array of ratings
 */
export const calculateDistribution = (
  ratings: number[]
): { 5: number; 4: number; 3: number; 2: number; 1: number } => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  ratings.forEach((rating) => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  return distribution;
};

/**
 * Calculate percentage for a rating level
 */
export const calculatePercentage = (count: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
};

/**
 * Format rating for display (e.g., "4.5" or "5.0")
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Get rating color based on value
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return '#F59E0B'; // Gold
  if (rating >= 3.5) return '#F97316'; // Orange
  if (rating >= 2.5) return '#FFC107'; // Yellow
  if (rating >= 1.5) return '#FB923C'; // Dark orange
  return '#EF4444'; // Red
};

/**
 * Get rating label (e.g., "Excellent", "Good", etc.)
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Below Average';
  return 'Poor';
};

/**
 * Calculate review stats from an array of ratings
 */
export const calculateReviewStats = (ratings: number[]): ReviewStats => {
  const averageRating = calculateAverageRating(ratings);
  const totalReviews = ratings.length;
  const distribution = calculateDistribution(ratings);

  return {
    averageRating,
    totalReviews,
    distribution,
  };
};

/**
 * Validate review stats consistency
 * Ensures distribution sum equals total reviews
 */
export const validateReviewStats = (stats: ReviewStats): boolean => {
  const distributionSum =
    stats.distribution[5] +
    stats.distribution[4] +
    stats.distribution[3] +
    stats.distribution[2] +
    stats.distribution[1];

  return distributionSum === stats.totalReviews;
};

/**
 * Get star icon name based on rating value
 */
export const getStarIconName = (
  starIndex: number,
  rating: number
): 'star' | 'star-half' | 'star-outline' => {
  const starValue = starIndex + 1;

  if (rating >= starValue) {
    return 'star';
  } else if (rating >= starValue - 0.5) {
    return 'star-half';
  } else {
    return 'star-outline';
  }
};
