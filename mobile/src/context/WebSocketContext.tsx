import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://10.228.141.81:3001';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

export interface WebSocketMessage {
    type: 'connected' | 'message' | 'typing' | 'messageRead' | 'userOnline' | 'userOffline' | 'error' | 'pong';
    data: any;
}

interface WebSocketContextType {
    isConnected: boolean;
    sendMessage: (roomId: string, content: string, type?: string) => void;
    sendTyping: (roomId: string, isTyping: boolean) => void;
    markRead: (roomId: string, messageId?: string) => void;
    subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const messageQueueRef = useRef<any[]>([]);

    const connect = useCallback(async () => {
        if (!user) {
            console.log('🔌 WebSocket: No user, skipping connection');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('🔌 WebSocket: Already connected');
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('accessToken');
            if (!token) {
                console.log('🔌 WebSocket: No token found');
                return;
            }

            const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
            console.log('🔌 WebSocket: Connecting to', WS_URL);

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket: Connected');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;

                // Send queued messages
                while (messageQueueRef.current.length > 0) {
                    const msg = messageQueueRef.current.shift();
                    ws.send(JSON.stringify(msg));
                }

                // Start heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                }
                heartbeatIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: 'ping' }));
                    }
                }, HEARTBEAT_INTERVAL);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    
                    // Notify all subscribers
                    subscribersRef.current.forEach(callback => {
                        try {
                            callback(message);
                        } catch (error) {
                            console.error('🔌 WebSocket: Subscriber error', error);
                        }
                    });
                } catch (error) {
                    console.error('🔌 WebSocket: Failed to parse message', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket: Error', error);
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket: Disconnected', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnection
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔌 WebSocket: Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
                    reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
                } else {
                    console.log('❌ WebSocket: Max reconnection attempts reached');
                }
            };
        } catch (error) {
            console.error('❌ WebSocket: Connection error', error);
        }
    }, [user]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        if (user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user, connect, disconnect]);

    const sendMessage = useCallback((roomId: string, content: string, type: string = 'TEXT') => {
        const message = {
            action: 'sendMessage',
            data: { roomId, content, type }
        };

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.log('🔌 WebSocket: Queuing message (not connected)');
            messageQueueRef.current.push(message);
        }
    }, []);

    const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'typing',
                data: { roomId, isTyping }
            }));
        }
    }, []);

    const markRead = useCallback((roomId: string, messageId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: 'markRead',
                data: { roomId, messageId }
            }));
        }
    }, []);

    const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, sendMessage, sendTyping, markRead, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
