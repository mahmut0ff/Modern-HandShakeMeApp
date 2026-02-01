// Chat types for DynamoDB

export interface ChatRoom {
  id: string;
  projectId?: string;
  participants: string[];
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  isEdited: boolean;
  isRead: boolean;
  readBy: Record<string, string>; // userId -> timestamp
  createdAt: string;
  updatedAt?: string;
}

export interface ChatParticipant {
  roomId: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
  unreadCount: number;
  isActive: boolean;
}

export interface WebSocketConnection {
  connectionId: string;
  userId: string;
  connectedAt: string;
  lastPingAt?: string;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  isTyping: boolean;
  timestamp: string;
}

// WebSocket message types
export interface WebSocketMessage {
  action: 'sendMessage' | 'editMessage' | 'deleteMessage' | 'typing' | 'markRead';
  data: any;
}

export interface SendMessageData {
  roomId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  replyToId?: string;
}

export interface EditMessageData {
  messageId: string;
  content: string;
}

export interface DeleteMessageData {
  messageId: string;
}

export interface TypingData {
  roomId: string;
  isTyping: boolean;
}

export interface MarkReadData {
  messageId?: string;
  roomId?: string;
}

// Response types
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ChatRoomWithParticipants extends ChatRoom {
  participants: Array<{
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      isOnline: boolean;
      lastSeenAt?: string;
    };
    unreadCount: number;
    lastReadAt?: string;
  }>;
  messageCount: number;
}

// WebSocket broadcast message types
export interface BroadcastMessage {
  type: 'message' | 'messageEdited' | 'messageDeleted' | 'typing' | 'userOnline' | 'userOffline';
  data: any;
}