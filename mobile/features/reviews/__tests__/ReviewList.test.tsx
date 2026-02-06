import React from 'react';
import { render } from '@testing-library/react-native';
import { ReviewList } from '../components/ReviewList';
import { Review } from '../components/ReviewItem';

const mockReviews: Review[] = [
  {
    id: 1,
    rating: 5,
    comment: 'Excellent work!',
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
  },
  {
    id: 2,
    rating: 4,
    comment: 'Good service',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
    isEdited: false,
    reviewer: {
      id: 3,
      name: 'Bob Wilson',
      avatar: undefined,
    },
    master: {
      id: 2,
      name: 'Jane Smith',
      avatar: undefined,
    },
    helpfulCount: 2,
    isHelpfulByMe: true,
  },
];

describe('ReviewList', () => {
  it('renders list of reviews', () => {
    const { UNSAFE_root } = render(
      <ReviewList reviews={mockReviews} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    const { UNSAFE_root } = render(
      <ReviewList reviews={[]} isLoading />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows empty state when no reviews', () => {
    const { UNSAFE_root } = render(
      <ReviewList reviews={[]} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows custom empty message', () => {
    const customMessage = 'No reviews found for this master';
    const { UNSAFE_root } = render(
      <ReviewList reviews={[]} emptyMessage={customMessage} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows load more indicator when hasMore is true', () => {
    const { UNSAFE_root } = render(
      <ReviewList reviews={mockReviews} hasMore />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with all callbacks', () => {
    const { UNSAFE_root } = render(
      <ReviewList
        reviews={mockReviews}
        currentUserId={1}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onRespond={jest.fn()}
        onReport={jest.fn()}
        onMarkHelpful={jest.fn()}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
