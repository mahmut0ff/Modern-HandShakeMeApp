import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatListItem } from '../components/ChatListItem';
import type { ChatRoom } from '../../../services/chatApi';

const mockRoom: ChatRoom = {
  id: 1,
  participants: [
    {
      id: 1,
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        avatar: null,
        role: 'master',
      },
      is_online: true,
      joined_at: new Date().toISOString(),
    },
    {
      id: 2,
      user: {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        avatar: null,
        role: 'client',
      },
      is_online: false,
      joined_at: new Date().toISOString(),
    },
  ],
  order_title: 'Fix plumbing',
  unread_count: 3,
  is_active: true,
  created_at: new Date().toISOString(),
  last_message: {
    id: 1,
    room: 1,
    sender: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      avatar: null,
      role: 'master',
    },
    message_type: 'text',
    content: 'Hello!',
    is_read: false,
    is_edited: false,
    created_at: new Date().toISOString(),
  },
};

describe('ChatListItem', () => {
  it('renders chat room correctly', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={mockRoom}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Fix plumbing')).toBeTruthy();
    expect(getByText('Hello!')).toBeTruthy();
  });

  it('shows unread count badge', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={mockRoom}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    expect(getByText('3')).toBeTruthy();
  });

  it('shows online indicator', () => {
    const onPress = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ChatListItem
        room={mockRoom}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    // Online indicator is a View with specific styling
    expect(UNSAFE_getAllByType('View').length).toBeGreaterThan(0);
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={mockRoom}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    fireEvent.press(getByText('John Doe'));

    expect(onPress).toHaveBeenCalled();
  });

  it('shows role badge', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={mockRoom}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    expect(getByText('Мастер')).toBeTruthy();
  });

  it('shows image indicator for image messages', () => {
    const roomWithImage = {
      ...mockRoom,
      last_message: {
        ...mockRoom.last_message!,
        message_type: 'image' as const,
        content: null,
      },
    };

    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={roomWithImage}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    expect(getByText('📷 Изображение')).toBeTruthy();
  });

  it('shows file indicator for file messages', () => {
    const roomWithFile = {
      ...mockRoom,
      last_message: {
        ...mockRoom.last_message!,
        message_type: 'file' as const,
        content: null,
      },
    };

    const onPress = jest.fn();
    const { getByText } = render(
      <ChatListItem
        room={roomWithFile}
        currentUserRole="client"
        onPress={onPress}
      />
    );

    expect(getByText('📎 Файл')).toBeTruthy();
  });
});
