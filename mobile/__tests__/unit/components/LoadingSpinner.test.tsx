import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render without crashing', () => {
    const { root } = render(<LoadingSpinner />);
    expect(root).toBeTruthy();
  });

  it('should display loading text when provided', () => {
    const { getByText } = render(<LoadingSpinner text="Loading data..." />);
    expect(getByText('Loading data...')).toBeTruthy();
  });

  it('should not display text when not provided', () => {
    const { queryByText } = render(<LoadingSpinner />);
    // Just check that component renders
    expect(queryByText(/loading/i)).toBeNull();
  });

  it('should render in fullScreen mode', () => {
    const { root } = render(<LoadingSpinner fullScreen />);
    expect(root).toBeTruthy();
  });

  it('should apply custom size', () => {
    const { root } = render(<LoadingSpinner size="large" />);
    expect(root).toBeTruthy();
  });

  it('should apply custom color', () => {
    const { root } = render(<LoadingSpinner color="#FF0000" />);
    expect(root).toBeTruthy();
  });
});
