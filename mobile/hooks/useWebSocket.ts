import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from './redux';
import websocketService from '../services/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {

    if (isAuthenticated) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }

    const handleConnection = (connected: boolean) => {
      setIsConnected(connected);
    };

    websocketService.onConnection(handleConnection);

    return () => {
      websocketService.offConnection(handleConnection);
    };
  }, [isAuthenticated]);

  const sendMessage = useCallback((type: string, data: any) => {
    websocketService.send(type, data);
  }, []);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    websocketService.onMessage(type, handler);
    return () => websocketService.offMessage(type);
  }, []);

  return {
    isConnected,
    sendMessage,
    onMessage,
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
    sendChatMessage: websocketService.sendChatMessage.bind(websocketService),
    markMessageRead: websocketService.markMessageRead.bind(websocketService),
    setTyping: websocketService.setTyping.bind(websocketService),
  };
}

export function useChatRoom(roomId: number) {
  const { isConnected, onMessage, joinRoom, leaveRoom, sendChatMessage, markMessageRead, setTyping } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
      
      const unsubscribeMessage = onMessage('chat_message', (data) => {
        if (data.room === roomId) {
          setMessages(prev => [...prev, data]);
        }
      });

      const unsubscribeTyping = onMessage('typing', (data) => {
        if (data.room_id === roomId) {
          setTypingUsers(prev => {
            if (data.is_typing) {
              return prev.find(u => u.id === data.user.id) 
                ? prev 
                : [...prev, data.user];
            } else {
              return prev.filter(u => u.id !== data.user.id);
            }
          });
        }
      });

      const unsubscribeRead = onMessage('message_read', (data) => {
        if (data.room_id === roomId) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, is_read: true, read_at: data.read_at }
              : msg
          ));
        }
      });

      return () => {
        leaveRoom(roomId);
        unsubscribeMessage();
        unsubscribeTyping();
        unsubscribeRead();
      };
    }
  }, [isConnected, roomId]);

  const sendMessage = useCallback((content: string, replyTo?: number) => {
    sendChatMessage(roomId, content, replyTo);
  }, [roomId, sendChatMessage]);

  const markRead = useCallback((messageId: number) => {
    markMessageRead(messageId);
  }, [markMessageRead]);

  const updateTyping = useCallback((isTyping: boolean) => {
    setTyping(roomId, isTyping);
  }, [roomId, setTyping]);

  return {
    messages,
    typingUsers,
    sendMessage,
    markRead,
    updateTyping,
    isConnected
  };
}