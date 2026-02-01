/**
 * WebSocket service for real-time functionality
 */

import { store } from '../store';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface ChatMessage {
  id: number;
  room: number;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar: string | null;
    role: 'client' | 'master';
  };
  message_type: 'text' | 'image' | 'file' | 'system';
  content?: string;
  file?: string;
  file_url?: string;
  image?: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const state = store.getState();
    const token = state.auth.accessToken;

    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      this.isConnecting = false;
      return;
    }

    const wsUrl = process.env.EXPO_PUBLIC_WS_URL;

    if (!wsUrl) {
      console.log('WebSocket connection initialized for authenticated user');
      this.isConnecting = false;
      return;
    }

    try {
      // SECURITY FIX: Use subprotocol instead of query parameter for token
      this.ws = new WebSocket(wsUrl, [`Bearer.${token}`]);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          // FIXED: Don't disconnect on parse errors, just log them
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.notifyConnectionHandlers(false);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.notifyConnectionHandlers(false);

        // FIXED: Enhanced reconnection logic with exponential backoff
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    } else {
      console.log('Unhandled WebSocket message type:', message.type);
    }
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Connection handler error:', error);
      }
    });
  }

  // Message handlers
  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  // Connection handlers
  onConnection(handler: (connected: boolean) => void) {
    this.connectionHandlers.add(handler);
  }

  offConnection(handler: (connected: boolean) => void) {
    this.connectionHandlers.delete(handler);
  }

  // Send message
  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Chat specific methods
  joinRoom(roomId: number) {
    this.send('join_room', { room_id: roomId });
  }

  leaveRoom(roomId: number) {
    this.send('leave_room', { room_id: roomId });
  }

  sendChatMessage(roomId: number, content: string, replyTo?: number) {
    this.send('chat_message', {
      room_id: roomId,
      content,
      reply_to: replyTo
    });
  }

  markMessageRead(messageId: number) {
    this.send('mark_read', { message_id: messageId });
  }

  setTyping(roomId: number, isTyping: boolean) {
    this.send('typing', { room_id: roomId, is_typing: isTyping });
  }

  // Notification methods
  markNotificationRead(notificationId: number) {
    this.send('notification_read', { notification_id: notificationId });
  }

  // Status
  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;