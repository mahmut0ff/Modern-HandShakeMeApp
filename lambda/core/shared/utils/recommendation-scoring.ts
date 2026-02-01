// Advanced scoring utilities for recommendations

export interface ScoringWeights {
  category: number;
  skills: number;
  location: number;
  budget: number;
  quality: number;
  urgency: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  category: 40,
  skills: 25,
  location: 15,
  budget: 10,
  quality: 5,
  urgency: 5,
};

export interface BudgetCompatibility {
  score: number;
  reason?: string;
}

/**
 * Calculate budget compatibility score
 */
export function calculateBudgetScore(
  orderBudgetType: string,
  orderBudgetMin?: number,
  orderBudgetMax?: number,
  masterHourlyRate?: string,
  maxScore = 10
): BudgetCompatibility {
  if (orderBudgetType === 'NEGOTIABLE') {
    return {
      score: Math.round(maxScore * 0.8),
      reason: 'Negotiable budget'
    };
  }

  const masterRate = parseFloat(masterHourlyRate || '0');
  if (masterRate <= 0) {
    return {
      score: Math.round(maxScore * 0.5),
      reason: 'No rate set'
    };
  }

  const orderBudget = orderBudgetMax || orderBudgetMin || 0;
  if (orderBudget <= 0) {
    return {
      score: Math.round(maxScore * 0.3),
      reason: 'No budget specified'
    };
  }

  // Estimate hours based on typical project duration (4-8 hours)
  const estimatedHours = 6;
  const estimatedCost = masterRate * estimatedHours;
  const budgetRatio = orderBudget / estimatedCost;

  if (budgetRatio >= 1.5) {
    return {
      score: maxScore,
      reason: 'Excellent budget match'
    };
  } else if (budgetRatio >= 1.2) {
    return {
      score: Math.round(maxScore * 0.9),
      reason: 'Good budget match'
    };
  } else if (budgetRatio >= 1.0) {
    return {
      score: Math.round(maxScore * 0.7),
      reason: 'Fair budget match'
    };
  } else if (budgetRatio >= 0.8) {
    return {
      score: Math.round(maxScore * 0.5),
      reason: 'Tight budget'
    };
  } else {
    return {
      score: Math.round(maxScore * 0.2),
      reason: 'Low budget'
    };
  }
}

/**
 * Calculate urgency score based on days until expiry
 */
export function calculateUrgencyScore(expiresAt: string, maxScore = 5): { score: number; reason?: string } {
  const daysUntilExpiry = Math.ceil(
    (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry <= 1) {
    return {
      score: maxScore,
      reason: 'Very urgent (expires today)'
    };
  } else if (daysUntilExpiry <= 2) {
    return {
      score: Math.round(maxScore * 0.8),
      reason: 'Urgent order'
    };
  } else if (daysUntilExpiry <= 5) {
    return {
      score: Math.round(maxScore * 0.6),
      reason: 'Time-sensitive'
    };
  } else if (daysUntilExpiry <= 10) {
    return {
      score: Math.round(maxScore * 0.3),
      reason: 'Moderate timeline'
    };
  } else {
    return {
      score: 0,
      reason: undefined
    };
  }
}

/**
 * Calculate master quality bonus
 */
export function calculateQualityScore(
  masterRating: string,
  masterCompletedOrders: number,
  maxScore = 5
): { score: number; reason?: string } {
  const rating = parseFloat(masterRating || '0');
  
  if (rating >= 4.8 && masterCompletedOrders >= 50) {
    return {
      score: maxScore,
      reason: 'Top-rated experienced master'
    };
  } else if (rating >= 4.5 && masterCompletedOrders >= 20) {
    return {
      score: Math.round(maxScore * 0.9),
      reason: 'High-rated experienced master'
    };
  } else if (rating >= 4.5) {
    return {
      score: Math.round(maxScore * 0.7),
      reason: 'High-rated master'
    };
  } else if (rating >= 4.0) {
    return {
      score: Math.round(maxScore * 0.5),
      reason: 'Good-rated master'
    };
  } else if (masterCompletedOrders >= 10) {
    return {
      score: Math.round(maxScore * 0.3),
      reason: 'Experienced master'
    };
  } else {
    return {
      score: 0,
      reason: undefined
    };
  }
}

/**
 * Calculate category matching score
 */
export function calculateCategoryScore(
  masterCategories: number[],
  orderCategoryId: string,
  maxScore = 40
): { score: number; reason?: string } {
  const orderCatId = parseInt(orderCategoryId);
  
  if (masterCategories.includes(orderCatId)) {
    return {
      score: maxScore,
      reason: 'Perfect category match'
    };
  }
  
  // Could add logic for related categories here
  // For now, give partial score if master has multiple categories
  if (masterCategories.length >= 3) {
    return {
      score: Math.round(maxScore * 0.3),
      reason: 'Multi-category master'
    };
  }
  
  return {
    score: 0,
    reason: undefined
  };
}

/**
 * Apply scoring weights and normalize to 0-100
 */
export function normalizeScore(
  categoryScore: number,
  skillScore: number,
  locationScore: number,
  budgetScore: number,
  qualityScore: number,
  urgencyScore: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const totalScore = 
    (categoryScore / weights.category) * weights.category +
    (skillScore / weights.skills) * weights.skills +
    (locationScore / weights.location) * weights.location +
    (budgetScore / weights.budget) * weights.budget +
    (qualityScore / weights.quality) * weights.quality +
    (urgencyScore / weights.urgency) * weights.urgency;

  return Math.min(Math.round(totalScore), 100);
}

/**
 * Determine if order should be filtered out based on minimum criteria
 */
export function shouldFilterOrder(
  score: number,
  masterCategories: number[],
  orderCategoryId: string,
  minScore = 20,
  requireCategoryMatch = false
): boolean {
  if (score < minScore) {
    return true;
  }
  
  if (requireCategoryMatch && !masterCategories.includes(parseInt(orderCategoryId))) {
    return true;
  }
  
  return false;
}