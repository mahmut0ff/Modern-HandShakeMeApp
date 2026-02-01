import { useState, useCallback, useEffect } from 'react';
import recommendationsApi, {
  RecommendedOrder,
  RecommendationStats,
  MasterProfileSummary,
} from '../services/recommendationsApi';

interface UseRecommendationsOptions {
  autoLoad?: boolean;
  limit?: number;
  includeReasons?: boolean;
}

export const useRecommendations = (options: UseRecommendationsOptions = {}) => {
  const { autoLoad = true, limit = 50, includeReasons = true } = options;

  const [recommendations, setRecommendations] = useState<RecommendedOrder[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Load recommendations
   */
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await recommendationsApi.getRecommendedOrders({
        limit,
        includeReasons,
      });

      setRecommendations(response.recommendations);
      setStats(response.stats);
      setMasterProfile(response.masterProfile);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить рекомендации');
    } finally {
      setLoading(false);
    }
  }, [limit, includeReasons]);

  /**
   * Refresh recommendations
   */
  const refresh = useCallback(async () => {
    await loadRecommendations();
  }, [loadRecommendations]);

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

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadRecommendations();
    }
  }, [autoLoad, loadRecommendations]);

  return {
    recommendations,
    stats,
    masterProfile,
    loading,
    error,
    lastUpdated,
    loadRecommendations,
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
