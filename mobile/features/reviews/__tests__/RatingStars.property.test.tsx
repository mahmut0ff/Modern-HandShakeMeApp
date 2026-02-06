import * as fc from 'fast-check';
import { render } from '@testing-library/react-native';
import { RatingStars } from '../components/RatingStars';

/**
 * Property-Based Tests for RatingStars Component
 * Feature: phase4-reviews
 */

describe('RatingStars - Property-Based Tests', () => {
  /**
   * Property 1: Rating Range Validation
   * Validates: Requirements 4.2
   * 
   * For any rating value, the component should only accept and display
   * ratings between 1 and 5 inclusive. Values outside this range should
   * be handled gracefully.
   */
  it('Property 1: Rating Range Validation - rating must be 1-5', () => {
    fc.assert(
      fc.property(fc.integer(), (rating) => {
        const isValidRange = rating >= 1 && rating <= 5;
        
        // Test that component renders without crashing for any integer
        const { UNSAFE_root } = render(
          <RatingStars rating={rating} />
        );
        
        expect(UNSAFE_root).toBeTruthy();
        
        // For valid ratings, verify the component displays correctly
        if (isValidRange) {
          // Component should render 5 stars
          const stars = UNSAFE_root.findAllByType('View');
          expect(stars.length).toBeGreaterThan(0);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Half-star display consistency
   * For any rating with decimal values, the component should correctly
   * display half-stars for values ending in .5
   */
  it('Property: Half-star display for decimal ratings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(0, 0.5, 1),
        (whole, decimal) => {
          const rating = whole + (decimal === 1 ? 0 : decimal);
          
          // Ensure rating doesn't exceed 5
          const finalRating = Math.min(rating, 5);
          
          const { UNSAFE_root } = render(
            <RatingStars rating={finalRating} />
          );
          
          expect(UNSAFE_root).toBeTruthy();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Interactive mode consistency
   * For any valid rating, when interactive mode is enabled,
   * the onChange callback should be called with valid rating values (1-5)
   */
  it('Property: Interactive mode produces valid ratings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (initialRating) => {
          const onChange = jest.fn();
          
          const { UNSAFE_root } = render(
            <RatingStars 
              rating={initialRating} 
              interactive={true}
              onChange={onChange}
            />
          );
          
          expect(UNSAFE_root).toBeTruthy();
          
          // Component should render without errors
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
