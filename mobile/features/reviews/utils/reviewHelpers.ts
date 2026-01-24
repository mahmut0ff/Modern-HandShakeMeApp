/**
 * Review Helper Functions
 * Utilities for formatting and validating review data
 */

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
export const formatReviewDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Validate review comment text
 * Returns validation result with error message if invalid
 */
export const validateReviewText = (
  text: string,
  minLength: number = 10,
  maxLength: number = 1000
): { valid: boolean; error?: string } => {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return { valid: false, error: 'Review text is required' };
  }

  if (trimmedText.length < minLength) {
    return {
      valid: false,
      error: `Review must be at least ${minLength} characters`,
    };
  }

  if (trimmedText.length > maxLength) {
    return {
      valid: false,
      error: `Review cannot exceed ${maxLength} characters`,
    };
  }

  return { valid: true };
};

/**
 * Truncate long text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Calculate time since review was posted
 * Returns object with value and unit
 */
export const getTimeSinceReview = (
  dateString: string
): { value: number; unit: string } => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return { value: diffYears, unit: 'year' };
  if (diffMonths > 0) return { value: diffMonths, unit: 'month' };
  if (diffWeeks > 0) return { value: diffWeeks, unit: 'week' };
  if (diffDays > 0) return { value: diffDays, unit: 'day' };
  if (diffHours > 0) return { value: diffHours, unit: 'hour' };
  if (diffMinutes > 0) return { value: diffMinutes, unit: 'minute' };
  return { value: diffSeconds, unit: 'second' };
};

/**
 * Check if review text needs "Read more" button
 */
export const needsReadMore = (text: string, threshold: number = 200): boolean => {
  return text.length > threshold;
};

/**
 * Get character count display text
 */
export const getCharacterCountText = (
  currentLength: number,
  maxLength: number
): string => {
  return `${currentLength}/${maxLength}`;
};

/**
 * Check if character count is approaching limit
 */
export const isApproachingLimit = (
  currentLength: number,
  maxLength: number,
  threshold: number = 0.9
): boolean => {
  return currentLength >= maxLength * threshold;
};
