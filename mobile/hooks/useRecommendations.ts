import { useState, useCallback, useMemo } from 'react';
import {
  RecommendedOrder,
  RecommendationStats,
  MasterProfileSummary,
  useGetRecommendedOrdersQuery,
} from '../services/recommendationsApi';

interface UseRecommendationsOptions {
  autoLoad?: boolean;
  limit?: number;
  includeReasons?: boolean;
}

export const useRecommendations = (options: UseRecommendationsOptions = {}) => {
  const { autoLoad = true, limit = 50, includeReasons = true } = options;

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
    isSuccess
  } = useGetRecommendedOrdersQuery({ limit, includeReasons }, { skip: !autoLoad });

  const recommendations = useMemo(() => data?.recommendations || [], [data]);
  const stats = useMemo(() => data?.stats || null, [data]);
  const masterProfile = useMemo(() => data?.masterProfile || null, [data]);

  const error = queryError ? 'Не удалось загрузить рекомендации' : null;
  const lastUpdated = useMemo(() => isSuccess ? new Date() : null, [isSuccess, data]);

  /**
   * Refresh recommendations
   */
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Filter recommendations by score
   */
  const filterByScore = useCallback(
    (minScore: number, maxScore?: number) => {
      return recommendations.filter((r) => {
        if (maxScore !== undefined) {
          return r.matchScore >= minScore && r.matchScore < maxScore;
        }
        return r.matchScore >= minScore;
      });
    },
    [recommendations]
  );

  /**
   * Get recommendations by category
   */
  const getByCategory = useCallback(
    (categoryId: string) => {
      return recommendations.filter((r) => r.category?.id === categoryId);
    },
    [recommendations]
  );

  /**
   * Get recommendations by city
   */
  const getByCity = useCallback(
    (city: string) => {
      return recommendations.filter(
        (r) => r.city.toLowerCase() === city.toLowerCase()
      );
    },
    [recommendations]
  );

  /**
   * Get urgent recommendations
   */
  const getUrgent = useCallback(() => {
    return recommendations.filter((r) => r.daysUntilExpiry <= 3);
  }, [recommendations]);

  /**
   * Get high score recommendations
   */
  const getHighScore = useCallback(() => {
    return recommendations.filter((r) => r.matchScore >= 80);
  }, [recommendations]);

  /**
   * Sort recommendations
   */
  const sort = useCallback(
    (
      by: 'score' | 'urgency' | 'applications' | 'budget',
      order: 'asc' | 'desc' = 'desc'
    ) => {
      const sorted = [...recommendations].sort((a, b) => {
        let comparison = 0;

        switch (by) {
          case 'score':
            comparison = a.matchScore - b.matchScore;
            break;
          case 'urgency':
            comparison = a.daysUntilExpiry - b.daysUntilExpiry;
            break;
          case 'applications':
            comparison = a.applicationsCount - b.applicationsCount;
            break;
          case 'budget':
            const aMax = a.budgetMax || a.budgetMin || 0;
            const bMax = b.budgetMax || b.budgetMin || 0;
            comparison = aMax - bMax;
            break;
        }

        return order === 'desc' ? -comparison : comparison;
      });

      return sorted;
    },
    [recommendations]
  );

  /**
   * Get recommendation by ID
   */
  const getById = useCallback(
    (id: string) => {
      return recommendations.find((r) => r.id === id);
    },
    [recommendations]
  );

  /**
   * Check if recommendations need refresh (older than 30 minutes)
   */
  const needsRefresh = useCallback(() => {
    if (!lastUpdated) return true;
    const thirtyMinutes = 30 * 60 * 1000;
    return Date.now() - lastUpdated.getTime() > thirtyMinutes;
  }, [lastUpdated]);

  return {
    recommendations,
    stats,
    masterProfile,
    loading,
    error,
    lastUpdated,
    loadRecommendations: refresh, // Alias for compatibility
    refresh,
    filterByScore,
    getByCategory,
    getByCity,
    getUrgent,
    getHighScore,
    sort,
    getById,
    needsRefresh,
  };
};
