import React from 'react';
import { render } from '@testing-library/react-native';
import { TypingIndicator } from '../components/TypingIndicator';

describe('TypingIndicator', () => {
  it('renders nothing when no users are typing', () => {
    const { UNSAFE_root } = render(<TypingIndicator users={[]} />);
    
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders single user typing', () => {
    const users = [
      { id: 1, first_name: 'John', last_name: 'Doe' },
    ];

    const { getByText } = render(<TypingIndicator users={users} />);
    
    expect(getByText('John печатает')).toBeTruthy();
  });

  it('renders two users typing', () => {
    const users = [
      { id: 1, first_name: 'John', last_name: 'Doe' },
      { id: 2, first_name: 'Jane', last_name: 'Smith' },
    ];

    const { getByText } = render(<TypingIndicator users={users} />);
    
    expect(getByText('John и Jane печатает')).toBeTruthy();
  });

  it('renders multiple users typing', () => {
    const users = [
      { id: 1, first_name: 'John', last_name: 'Doe' },
      { id: 2, first_name: 'Jane', last_name: 'Smith' },
      { id: 3, first_name: 'Bob', last_name: 'Johnson' },
    ];

    const { getByText } = render(<TypingIndicator users={users} />);
    
    expect(getByText('John и еще 2 печатает')).toBeTruthy();
  });
});
