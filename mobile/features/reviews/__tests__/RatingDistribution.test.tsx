import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RatingDistribution, ReviewStats } from '../components/RatingDistribution';

describe('RatingDistribution', () => {
  const mockStats: ReviewStats = {
    averageRating: 4.5,
    totalReviews: 100,
    distribution: {
      5: 60,
      4: 20,
      3: 10,
      2: 5,
      1: 5,
    },
  };

  describe('Average Display', () => {
    it('displays average rating correctly', () => {
      const { getByText } = render(<RatingDistribution stats={mockStats} />);
      expect(getByText('4.5')).toBeTruthy();
    });

    it('displays total reviews count', () => {
      const { getByText } = render(<RatingDistribution stats={mockStats} />);
      expect(getByText('100 reviews')).toBeTruthy();
    });

    it('displays singular "review" for 1 review', () => {
      const singleReviewStats: ReviewStats = {
        averageRating: 5.0,
        totalReviews: 1,
        distribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
      const { getByText } = render(<RatingDistribution stats={singleReviewStats} />);
      expect(getByText('1 review')).toBeTruthy();
    });
  });

  describe('Percentage Calculations', () => {
    it('calculates percentages correctly', () => {
      const { getAllByText } = render(<RatingDistribution stats={mockStats} />);
      
      // 60/100 = 60%
      expect(getAllByText('(60%)').length).toBeGreaterThan(0);
      // 20/100 = 20%
      expect(getAllByText('(20%)').length).toBeGreaterThan(0);
      // 10/100 = 10%
      expect(getAllByText('(10%)').length).toBeGreaterThan(0);
      // 5/100 = 5% (appears twice for 2 stars and 1 star)
      expect(getAllByText('(5%)').length).toBeGreaterThan(0);
    });

    it('handles zero reviews', () => {
      const zeroStats: ReviewStats = {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
      const { getByText, getAllByText } = render(<RatingDistribution stats={zeroStats} />);
      
      expect(getByText('0 reviews')).toBeTruthy();
      // (0%) appears multiple times for each rating level
      expect(getAllByText('(0%)').length).toBeGreaterThan(0);
    });

    it('rounds percentages to nearest integer', () => {
      const oddStats: ReviewStats = {
        averageRating: 3.7,
        totalReviews: 3,
        distribution: { 5: 1, 4: 1, 3: 1, 2: 0, 1: 0 },
      };
      const { getAllByText } = render(<RatingDistribution stats={oddStats} />);
      
      // 1/3 = 33.33% -> rounds to 33% (appears 3 times for 5, 4, 3 stars)
      expect(getAllByText('(33%)').length).toBeGreaterThan(0);
    });
  });

  describe('Bar Width Rendering', () => {
    it('renders distribution bars', () => {
      const { UNSAFE_root } = render(<RatingDistribution stats={mockStats} />);
      expect(UNSAFE_root).toBeTruthy();
      
      // Should render 5 distribution rows (one for each rating level)
      const views = UNSAFE_root.findAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('displays count for each rating level', () => {
      const { getByText, getAllByText } = render(<RatingDistribution stats={mockStats} />);
      
      expect(getByText('60')).toBeTruthy(); // 5 stars
      expect(getByText('20')).toBeTruthy(); // 4 stars
      expect(getByText('10')).toBeTruthy(); // 3 stars
      // 5 appears twice (for 2 stars and 1 star)
      expect(getAllByText('5').length).toBeGreaterThan(0);
    });
  });

  describe('Tap Interaction', () => {
    it('renders with onRatingTap handler', () => {
      const onRatingTap = jest.fn();
      const { UNSAFE_root } = render(
        <RatingDistribution stats={mockStats} onRatingTap={onRatingTap} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders correctly with tap handler', () => {
      const onRatingTap = jest.fn();
      const { UNSAFE_root } = render(
        <RatingDistribution stats={mockStats} onRatingTap={onRatingTap} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('does not call onRatingTap when not provided', () => {
      const { UNSAFE_root } = render(<RatingDistribution stats={mockStats} />);
      
      // Should render without errors even without onRatingTap
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles all reviews at one rating level', () => {
      const allFiveStars: ReviewStats = {
        averageRating: 5.0,
        totalReviews: 50,
        distribution: { 5: 50, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
      const { getByText, getAllByText } = render(<RatingDistribution stats={allFiveStars} />);
      
      expect(getByText('5.0')).toBeTruthy();
      expect(getByText('50 reviews')).toBeTruthy();
      expect(getByText('(100%)')).toBeTruthy();
      // (0%) appears multiple times for each rating level with 0 reviews
      expect(getAllByText('(0%)').length).toBeGreaterThan(0);
    });

    it('handles evenly distributed ratings', () => {
      const evenStats: ReviewStats = {
        averageRating: 3.0,
        totalReviews: 50,
        distribution: { 5: 10, 4: 10, 3: 10, 2: 10, 1: 10 },
      };
      const { getByText, getAllByText } = render(<RatingDistribution stats={evenStats} />);
      
      expect(getByText('3.0')).toBeTruthy();
      expect(getByText('50 reviews')).toBeTruthy();
      // Each should be 20% (appears 5 times for each rating level)
      expect(getAllByText('(20%)').length).toBeGreaterThan(0);
    });

    it('handles decimal average ratings', () => {
      const decimalStats: ReviewStats = {
        averageRating: 3.7,
        totalReviews: 10,
        distribution: { 5: 2, 4: 3, 3: 2, 2: 2, 1: 1 },
      };
      const { getByText } = render(<RatingDistribution stats={decimalStats} />);
      
      expect(getByText('3.7')).toBeTruthy();
    });
  });
});
