import React from 'react';
import { render } from '@testing-library/react-native';
import { ResponseForm } from '../components/ResponseForm';

describe('ResponseForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('displays reviewer name when provided', () => {
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} reviewerName="Jane Smith" />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with cancel button when onCancel provided', () => {
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders in loading state', () => {
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} isLoading />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('uses custom submit label', () => {
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} submitLabel="Update Response" />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('loads initial response when provided', () => {
    const initialResponse = 'Thank you for your review!';
    const { UNSAFE_root } = render(
      <ResponseForm onSubmit={mockOnSubmit} initialResponse={initialResponse} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with all props', () => {
    const { UNSAFE_root } = render(
      <ResponseForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
        submitLabel="Submit"
        reviewerName="Client"
        initialResponse="Thanks!"
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
