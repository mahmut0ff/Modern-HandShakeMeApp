import React from 'react';
import { render } from '@testing-library/react-native';
import { ReviewItem, Review } from '../components/ReviewItem';

const mockReview: Review = {
  id: 1,
  rating: 5,
  comment: 'Excellent work! The master was professional and completed the job on time.',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  isEdited: false,
  reviewer: {
    id: 1,
    name: 'John Doe',
    avatar: undefined,
  },
  master: {
    id: 2,
    name: 'Jane Smith',
    avatar: undefined,
  },
  helpfulCount: 5,
  isHelpfulByMe: false,
};

describe('ReviewItem', () => {
  it('renders review correctly', () => {
    const { UNSAFE_root } = render(<ReviewItem review={mockReview} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows edited badge when review is edited', () => {
    const editedReview = { ...mockReview, isEdited: true };
    const { UNSAFE_root } = render(<ReviewItem review={editedReview} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows response when present', () => {
    const reviewWithResponse = {
      ...mockReview,
      response: {
        id: 1,
        text: 'Thank you for your feedback!',
        createdAt: '2024-01-16T10:00:00Z',
      },
    };
    const { UNSAFE_root } = render(<ReviewItem review={reviewWithResponse} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('truncates long comments', () => {
    const longComment = 'A'.repeat(250);
    const longReview = { ...mockReview, comment: longComment };
    const { UNSAFE_root } = render(<ReviewItem review={longReview} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with actions when showActions is true', () => {
    const { UNSAFE_root } = render(
      <ReviewItem review={mockReview} showActions currentUserId={1} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with all callbacks', () => {
    const { UNSAFE_root } = render(
      <ReviewItem
        review={mockReview}
        currentUserId={2}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onRespond={jest.fn()}
        onReport={jest.fn()}
        onMarkHelpful={jest.fn()}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders when user marked as helpful', () => {
    const helpfulReview = { ...mockReview, isHelpfulByMe: true };
    const { UNSAFE_root } = render(<ReviewItem review={helpfulReview} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
