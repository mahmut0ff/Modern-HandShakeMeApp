import apiClient from './client';

export interface ChatParticipant {
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
}

export interface ChatRoom {
    id: string;
    projectId?: string;
    orderId?: string;
    participants: ChatParticipant[];
    lastMessageAt: string;
    lastMessage?: string;
    messageCount: number;
    createdAt: string;
    updatedAt?: string;
}

export interface Message {
    id: string;
    roomId: string;
    senderId: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
    isEdited: boolean;
    isRead: boolean;
    readBy: Record<string, string>;
    createdAt: string;
    updatedAt?: string;
    sender?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

export interface CreateRoomRequest {
    participants: string[];
    orderId?: string;
    projectId?: string;
}

export interface SendMessageRequest {
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
    replyToId?: string;
}

export interface ChatRoomsResponse {
    rooms: ChatRoom[];
    count: number;
}

export interface MessagesResponse {
    messages: Message[];
    count: number;
    hasMore: boolean;
}

export const chatApi = {
    // Room operations
    listRooms: async (params?: { page_size?: number }) => {
        const response = await apiClient.get<ChatRoom[]>('/chat/rooms', { params });
        return { data: response.data || [] };
    },

    createRoom: (data: CreateRoomRequest) =>
        apiClient.post<ChatRoom>('/chat/rooms', data),

    getRoom: (roomId: string) =>
        apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`),

    // Message operations
    getMessages: (roomId: string, params?: { limit?: number; lastMessageId?: string }) =>
        apiClient.get<Message[]>(`/chat/rooms/${roomId}/messages`, { params }),

    sendMessage: (roomId: string, data: SendMessageRequest) =>
        apiClient.post<Message>(`/chat/rooms/${roomId}/messages`, data),

    sendImage: async (roomId: string, imageUri: string) => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('image', {
            uri: imageUri,
            name: 'chat-image.jpg',
            type: 'image/jpeg',
        });
        return apiClient.post<Message>(`/chat/rooms/${roomId}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Read receipts
    markRoomRead: (roomId: string) =>
        apiClient.post(`/chat/rooms/${roomId}/read`),
};
