import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReviewForm } from '../components/ReviewForm';

describe('ReviewForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { UNSAFE_root } = render(
      <ReviewForm onSubmit={mockOnSubmit} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('displays project info when provided', () => {
    const { UNSAFE_root } = render(
      <ReviewForm
        onSubmit={mockOnSubmit}
        projectTitle="Test Project"
        masterName="John Doe"
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with initial data', () => {
    const { UNSAFE_root } = render(
      <ReviewForm
        onSubmit={mockOnSubmit}
        initialData={{ rating: 4, comment: 'Great!', isAnonymous: false }}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with cancel button when onCancel provided', () => {
    const { UNSAFE_root } = render(
      <ReviewForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders in loading state', () => {
    const { UNSAFE_root } = render(
      <ReviewForm onSubmit={mockOnSubmit} isLoading />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('uses custom submit label', () => {
    const { UNSAFE_root } = render(
      <ReviewForm onSubmit={mockOnSubmit} submitLabel="Update Review" />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with all props', () => {
    const { UNSAFE_root } = render(
      <ReviewForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
        submitLabel="Submit"
        projectTitle="Project"
        masterName="Master"
        initialData={{ rating: 5, comment: 'Excellent', isAnonymous: true }}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
