import { api } from './api';

export interface RecommendedOrder {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
  } | null;
  city: string;
  budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  budgetMin: number | null;
  budgetMax: number | null;
  startDate: string;
  endDate: string;
  expiresAt: string;
  applicationsCount: number;
  matchScore: number;
  reasons?: string[];
  skillMatches: number;
  totalSkills: number;
  daysUntilExpiry: number;
  createdAt: string;
}

export interface RecommendationStats {
  totalRecommendations: number;
  averageScore: number;
  highScoreCount: number;
  sameCategory: number;
  sameCityCount: number;
}

export interface MasterProfileSummary {
  id: string;
  categories: number[];
  city: string;
  skillsCount: number;
  rating: number;
}

export interface RecommendationsResponse {
  recommendations: RecommendedOrder[];
  stats: RecommendationStats;
  masterProfile: MasterProfileSummary;
  generatedAt: string;
}

export const recommendationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendedOrders: builder.query<RecommendationsResponse, { limit?: number; includeReasons?: boolean } | void>({
      query: (params) => ({
        url: '/recommendations/orders',
        params: {
          limit: params?.limit || 10,
          includeReasons: params?.includeReasons !== false ? 'true' : 'false',
        },
      }),
      providesTags: ['Recommendation'],
    }),
  }),
});

export const { useGetRecommendedOrdersQuery } = recommendationsApi;

class RecommendationsHelpers {
  /**
   * Get match score explanation
   */
  getScoreLevel(score: number): {
    level: 'excellent' | 'good' | 'fair' | 'low';
    label: string;
    color: string;
  } {
    if (score >= 80) {
      return { level: 'excellent', label: 'Отличное совпадение', color: '#10B981' };
    } else if (score >= 60) {
      return { level: 'good', label: 'Хорошее совпадение', color: '#3B82F6' };
    } else if (score >= 40) {
      return { level: 'fair', label: 'Среднее совпадение', color: '#F59E0B' };
    } else {
      return { level: 'low', label: 'Низкое совпадение', color: '#6B7280' };
    }
  }

  /**
   * Format budget display
   */
  formatBudget(
    budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE',
    budgetMin: number | null,
    budgetMax: number | null
  ): string {
    if (budgetType === 'NEGOTIABLE') {
      return 'Договорная';
    }

    const currency = 'сом';
    const suffix = budgetType === 'HOURLY' ? '/час' : '';

    if (budgetMin && budgetMax) {
      return `${budgetMin}-${budgetMax} ${currency}${suffix}`;
    } else if (budgetMin) {
      return `от ${budgetMin} ${currency}${suffix}`;
    } else if (budgetMax) {
      return `до ${budgetMax} ${currency}${suffix}`;
    }

    return 'Не указан';
  }

  /**
   * Get urgency indicator
   */
  getUrgencyLevel(daysUntilExpiry: number): {
    level: 'urgent' | 'soon' | 'normal';
    label: string;
    color: string;
  } {
    if (daysUntilExpiry <= 1) {
      return { level: 'urgent', label: 'Срочно', color: '#EF4444' };
    } else if (daysUntilExpiry <= 3) {
      return { level: 'soon', label: 'Скоро истекает', color: '#F59E0B' };
    } else {
      return { level: 'normal', label: `${daysUntilExpiry} дн.`, color: '#6B7280' };
    }
  }

  /**
   * Calculate skill match percentage
   */
  getSkillMatchPercentage(skillMatches: number, totalSkills: number): number {
    if (totalSkills === 0) return 0;
    return Math.round((skillMatches / totalSkills) * 100);
  }

  /**
   * Group recommendations by score level
   */
  groupByScoreLevel(recommendations: RecommendedOrder[]): {
    excellent: RecommendedOrder[];
    good: RecommendedOrder[];
    fair: RecommendedOrder[];
    low: RecommendedOrder[];
  } {
    return {
      excellent: recommendations.filter((r) => r.matchScore >= 80),
      good: recommendations.filter((r) => r.matchScore >= 60 && r.matchScore < 80),
      fair: recommendations.filter((r) => r.matchScore >= 40 && r.matchScore < 60),
      low: recommendations.filter((r) => r.matchScore < 40),
    };
  }

  /**
   * Get top reasons for recommendation
   */
  getTopReasons(reasons: string[] | undefined, limit: number = 3): string[] {
    if (!reasons) return [];
    return reasons.slice(0, limit);
  }
}

export const recommendationsHelpers = new RecommendationsHelpers();
export default recommendationsHelpers;
