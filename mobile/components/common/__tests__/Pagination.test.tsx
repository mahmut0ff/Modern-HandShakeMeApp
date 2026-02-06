import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={() => {}}
      />
    );
    expect(getByText('1')).toBeTruthy();
  });

  it('does not render when totalPages is 1', () => {
    const { queryByText } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    );
    expect(queryByText('1')).toBeNull();
  });

  it('calls onPageChange when next button is pressed', () => {
    const onPageChange = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const nextButton = buttons[buttons.length - 1]; // Last button is next
    fireEvent.press(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when prev button is pressed', () => {
    const onPageChange = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const prevButton = buttons[0]; // First button is prev
    fireEvent.press(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables prev button on first page', () => {
    const { UNSAFE_getAllByType } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={() => {}}
      />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const prevButton = buttons[0];
    expect(prevButton.props.disabled).toBe(true);
  });

  it('disables next button on last page', () => {
    const { UNSAFE_getAllByType } = render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={() => {}}
      />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton.props.disabled).toBe(true);
  });
});
