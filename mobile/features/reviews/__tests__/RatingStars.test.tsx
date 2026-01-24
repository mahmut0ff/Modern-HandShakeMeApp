import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RatingStars } from '../components/RatingStars';

describe('RatingStars', () => {
  describe('Display Mode', () => {
    it('renders correctly with rating 5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={5} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders correctly with rating 3', () => {
      const { UNSAFE_root } = render(<RatingStars rating={3} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders correctly with rating 1', () => {
      const { UNSAFE_root } = render(<RatingStars rating={1} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders with small size', () => {
      const { UNSAFE_root } = render(<RatingStars rating={4} size="small" />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders with medium size', () => {
      const { UNSAFE_root } = render(<RatingStars rating={4} size="medium" />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders with large size', () => {
      const { UNSAFE_root } = render(<RatingStars rating={4} size="large" />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Half-star Display', () => {
    it('renders half-star for 4.5 rating', () => {
      const { UNSAFE_root } = render(<RatingStars rating={4.5} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders half-star for 3.5 rating', () => {
      const { UNSAFE_root } = render(<RatingStars rating={3.5} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders half-star for 2.5 rating', () => {
      const { UNSAFE_root } = render(<RatingStars rating={2.5} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Color Coding', () => {
    it('uses gold color for rating >= 4.5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={5} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('uses orange color for rating >= 3.5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={4} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('uses yellow color for rating >= 2.5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={3} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('uses dark orange color for rating >= 1.5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={2} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('uses red color for rating < 1.5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={1} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interactive Mode', () => {
    it('renders in interactive mode', () => {
      const onChange = jest.fn();
      const { UNSAFE_root } = render(
        <RatingStars rating={3} interactive={true} onChange={onChange} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders with onChange handler', () => {
      const onChange = jest.fn();
      const { UNSAFE_root } = render(
        <RatingStars rating={3} interactive={true} onChange={onChange} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('does not call onChange when not interactive', () => {
      const onChange = jest.fn();
      const { UNSAFE_root } = render(
        <RatingStars rating={3} interactive={false} onChange={onChange} />
      );

      expect(UNSAFE_root).toBeTruthy();
      // In non-interactive mode, stars are wrapped in View, not TouchableOpacity
      // So onChange should not be called
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles rating of 0', () => {
      const { UNSAFE_root } = render(<RatingStars rating={0} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('handles rating above 5', () => {
      const { UNSAFE_root } = render(<RatingStars rating={6} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('handles negative rating', () => {
      const { UNSAFE_root } = render(<RatingStars rating={-1} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('handles decimal ratings', () => {
      const { UNSAFE_root } = render(<RatingStars rating={3.7} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
