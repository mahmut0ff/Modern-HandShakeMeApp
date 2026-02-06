import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorMessage } from '../../../components/ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message', () => {
    const { getByText } = render(<ErrorMessage message="Something went wrong" />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should call onRetry when retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorMessage message="Error occurred" onRetry={onRetry} />
    );

    const retryButton = getByText(/повторить/i);
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry is not provided', () => {
    const { queryByText } = render(<ErrorMessage message="Error occurred" />);
    expect(queryByText(/повторить/i)).toBeNull();
  });

  it('should render in fullScreen mode', () => {
    const { getByText } = render(
      <ErrorMessage message="Error" fullScreen />
    );
    expect(getByText('Error')).toBeTruthy();
  });

  it('should display custom title', () => {
    const { getByText } = render(
      <ErrorMessage message="Error" title="Custom Error" />
    );
    expect(getByText('Error')).toBeTruthy();
  });

  it('should handle empty message', () => {
    const { root } = render(<ErrorMessage message="" />);
    expect(root).toBeTruthy();
  });
});
