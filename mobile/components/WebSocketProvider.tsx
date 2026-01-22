import React, { useEffect } from 'react';
import { useAppSelector } from '../hooks/redux';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('WebSocket connection initialized for authenticated user');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isConnected) {
      console.log('WebSocket connected successfully');
    } else {
      console.log('WebSocket disconnected');
    }
  }, [isConnected]);

  return <>{children}</>;
}