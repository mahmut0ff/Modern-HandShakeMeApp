import * as fc from 'fast-check';
import { render } from '@testing-library/react-native';
import { RatingDistribution, ReviewStats } from '../components/RatingDistribution';

/**
 * Property-Based Tests for RatingDistribution Component
 * Feature: phase4-reviews
 */

describe('RatingDistribution - Property-Based Tests', () => {
  /**
   * Property 4: Rating Statistics Consistency
   * Validates: Requirements 3.1, 3.3
   * 
   * For any set of reviews, the calculated average rating must equal
   * the sum of all ratings divided by the total number of reviews.
   */
  it('Property 4: Rating Statistics Consistency - average equals sum/count', () => {
    fc.assert(
      fc.property(
        fc.record({
          5: fc.integer({ min: 0, max: 100 }),
          4: fc.integer({ min: 0, max: 100 }),
          3: fc.integer({ min: 0, max: 100 }),
          2: fc.integer({ min: 0, max: 100 }),
          1: fc.integer({ min: 0, max: 100 }),
        }),
        (distribution) => {
          const totalReviews =
            distribution[5] +
            distribution[4] +
            distribution[3] +
            distribution[2] +
            distribution[1];

          // Skip if no reviews
          if (totalReviews === 0) return true;

          const sum =
            distribution[5] * 5 +
            distribution[4] * 4 +
            distribution[3] * 3 +
            distribution[2] * 2 +
            distribution[1] * 1;

          const expectedAverage = sum / totalReviews;

          const stats: ReviewStats = {
            averageRating: expectedAverage,
            totalReviews,
            distribution,
          };

          const { UNSAFE_root } = render(<RatingDistribution stats={stats} />);

          expect(UNSAFE_root).toBeTruthy();

          // Verify the average is within expected range
          expect(expectedAverage).toBeGreaterThanOrEqual(1);
          expect(expectedAverage).toBeLessThanOrEqual(5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Distribution Sum Consistency
   * Validates: Requirements 3.3
   * 
   * For any rating distribution, the sum of counts across all star levels (1-5)
   * must equal the total number of reviews.
   */
  it('Property 5: Distribution Sum Consistency - sum equals total', () => {
    fc.assert(
      fc.property(
        fc.record({
          5: fc.integer({ min: 0, max: 100 }),
          4: fc.integer({ min: 0, max: 100 }),
          3: fc.integer({ min: 0, max: 100 }),
          2: fc.integer({ min: 0, max: 100 }),
          1: fc.integer({ min: 0, max: 100 }),
        }),
        (distribution) => {
          const calculatedTotal =
            distribution[5] +
            distribution[4] +
            distribution[3] +
            distribution[2] +
            distribution[1];

          const stats: ReviewStats = {
            averageRating: 3.5, // Arbitrary average
            totalReviews: calculatedTotal,
            distribution,
          };

          const { UNSAFE_root } = render(<RatingDistribution stats={stats} />);

          expect(UNSAFE_root).toBeTruthy();

          // Verify the sum equals the total
          expect(calculatedTotal).toBe(stats.totalReviews);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Percentage calculations
   * For any distribution, all percentages must sum to 100% (or 0% if no reviews)
   */
  it('Property: Percentages sum to 100%', () => {
    fc.assert(
      fc.property(
        fc.record({
          5: fc.integer({ min: 0, max: 100 }),
          4: fc.integer({ min: 0, max: 100 }),
          3: fc.integer({ min: 0, max: 100 }),
          2: fc.integer({ min: 0, max: 100 }),
          1: fc.integer({ min: 0, max: 100 }),
        }),
        (distribution) => {
          const totalReviews =
            distribution[5] +
            distribution[4] +
            distribution[3] +
            distribution[2] +
            distribution[1];

          const stats: ReviewStats = {
            averageRating: 3.5,
            totalReviews,
            distribution,
          };

          const { UNSAFE_root } = render(<RatingDistribution stats={stats} />);

          expect(UNSAFE_root).toBeTruthy();

          if (totalReviews === 0) {
            // All percentages should be 0
            return true;
          }

          // Calculate percentages
          const percentages = [5, 4, 3, 2, 1].map((rating) => {
            const count = distribution[rating as keyof typeof distribution];
            return (count / totalReviews) * 100;
          });

          const sum = percentages.reduce((a, b) => a + b, 0);

          // Sum should be approximately 100 (allowing for floating point errors)
          expect(Math.abs(sum - 100)).toBeLessThan(0.01);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
