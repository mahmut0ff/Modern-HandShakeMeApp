import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Поиск...')).toBeTruthy();
  });

  it('displays custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Найти мастера"
      />
    );
    expect(getByPlaceholderText('Найти мастера')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Поиск...'), 'test query');
    expect(onChangeText).toHaveBeenCalledWith('test query');
  });

  it('shows clear button when value is not empty', () => {
    const { UNSAFE_getAllByType } = render(
      <SearchBar value="test" onChangeText={() => {}} />
    );
    
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // Clear button should exist
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onClear when clear button is pressed', () => {
    const onClear = jest.fn();
    const onChangeText = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <SearchBar value="test" onChangeText={onChangeText} onClear={onClear} />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    const clearButton = buttons[0]; // Should be the clear button
    fireEvent.press(clearButton);
    expect(onChangeText).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });
});
