import { api } from './api';
import websocketService from './websocket';

export interface ChatRoom {
  id: number;
  participants: ChatParticipant[];
  order?: {
    id: number;
    title: string;
  };
  order_id?: number;
  order_title?: string;
  project?: {
    id: number;
    title: string;
  };
  project_id?: number;
  project_title?: string;
  last_message?: ChatMessage;
  unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatParticipant {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar: string | null;
    role: 'client' | 'master';
  };
  user_id?: number;
  user_first_name?: string;
  user_last_name?: string;
  user_full_name?: string;
  user_avatar?: string | null;
  user_role?: 'client' | 'master';
  is_online: boolean;
  last_seen?: string;
  joined_at: string;
}

export interface ChatMessage {
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
  sender_id?: number;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_full_name?: string;
  sender_avatar?: string | null;
  sender_role?: 'client' | 'master';
  message_type: 'text' | 'image' | 'file' | 'system';
  content?: string;
  file?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  is_read: boolean;
  is_edited: boolean;
  reply_to?: number;
  reply_to_message?: ChatMessage;
  created_at: string;
  updated_at?: string;
  read_at?: string;
}

export interface ChatMessageCreateData {
  room: number;
  message_type: 'text' | 'image' | 'file';
  content?: string;
  reply_to?: number;
}

export interface ChatRoomCreateData {
  participants: number[];
  order?: number;
  project?: number;
}

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Chat rooms
    getChatRooms: builder.query<ChatRoom[], void>({
      query: () => '/chat/rooms',
      transformResponse: (response: any) => {
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        return response;
      },
      providesTags: ['Chat'],
    }),

    getChatRoom: builder.query<ChatRoom, number>({
      query: (id) => `/chat/rooms/${id}`,
      providesTags: ['Chat'],
    }),

    createChatRoom: builder.mutation<ChatRoom, ChatRoomCreateData>({
      query: (data) => ({
        url: '/chat/rooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Chat messages
    getChatMessages: builder.query<{ results: ChatMessage[]; count: number }, { 
      roomId: number; 
      page?: number; 
      page_size?: number 
    }>({
      query: ({ roomId, page, page_size }) => ({
        url: `/chat/rooms/${roomId}/messages`,
        params: { page, page_size },
      }),
      providesTags: ['Chat'],
    }),

    sendMessage: builder.mutation<ChatMessage, ChatMessageCreateData>({
      query: (data) => ({
        url: `/chat/rooms/${data.room}/messages`,
        method: 'POST',
        body: {
          message_type: data.message_type,
          content: data.content,
          reply_to: data.reply_to,
        },
      }),
      invalidatesTags: ['Chat'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Send via WebSocket for real-time delivery
          websocketService.send('chat_message', data);
        } catch (error) {
          console.error('Failed to send message via WebSocket:', error);
        }
      },
    }),

    sendImageMessage: builder.mutation<ChatMessage, { roomId: number; image: FormData; reply_to?: number }>({
      query: ({ roomId, image, reply_to }) => {
        if (reply_to) {
          image.append('reply_to', reply_to.toString());
        }
        return {
          url: `/chat/rooms/${roomId}/image`,
          method: 'POST',
          body: image,
          formData: true,
        };
      },
      invalidatesTags: ['Chat'],
    }),

    sendFileMessage: builder.mutation<ChatMessage, { roomId: number; file: FormData; reply_to?: number }>({
      query: ({ roomId, file, reply_to }) => {
        if (reply_to) {
          file.append('reply_to', reply_to.toString());
        }
        return {
          url: `/chat/rooms/${roomId}/messages`,
          method: 'POST',
          body: file,
          formData: true,
        };
      },
      invalidatesTags: ['Chat'],
    }),

    // Note: Individual message edit/delete - use room-based operations
    // Backend doesn't have individual message endpoints, so we'll use room messages
    editMessage: builder.mutation<ChatMessage, { id: number; content: string; roomId: number }>({
      query: ({ id, content, roomId }) => ({
        url: `/chat/rooms/${roomId}/messages`,
        method: 'POST',
        body: { content, edit_message_id: id },
      }),
      invalidatesTags: ['Chat'],
    }),

    deleteMessage: builder.mutation<void, { id: number; roomId: number }>({
      query: ({ id, roomId }) => ({
        url: `/chat/rooms/${roomId}/messages`,
        method: 'POST',
        body: { delete_message_id: id },
      }),
      invalidatesTags: ['Chat'],
    }),

    markRoomRead: builder.mutation<void, number>({
      query: (roomId) => ({
        url: `/chat/rooms/${roomId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Note: Use room-based read instead of individual message read
    markMessageRead: builder.mutation<void, { messageId: number; roomId: number }>({
      query: ({ roomId }) => ({
        url: `/chat/rooms/${roomId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Chat'],
      async onQueryStarted({ messageId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          websocketService.markMessageRead(messageId);
        } catch (error) {
          console.error('Failed to mark message read via WebSocket:', error);
        }
      },
    }),

    // Typing indicators - send via WebSocket only (no REST endpoint)
    setTyping: builder.mutation<void, { roomId: number; isTyping: boolean }>({
      queryFn: async ({ roomId, isTyping }) => {
        try {
          websocketService.setTyping(roomId, isTyping);
          return { data: undefined };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: 'WebSocket error' } };
        }
      },
    }),

    // Online status - send via WebSocket only (no REST endpoint)
    setOnlineStatus: builder.mutation<void, { isOnline: boolean }>({
      queryFn: async ({ isOnline }) => {
        try {
          websocketService.send('online_status', { is_online: isOnline });
          return { data: undefined };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: 'WebSocket error' } };
        }
      },
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetChatRoomQuery,
  useCreateChatRoomMutation,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useSendImageMessageMutation,
  useSendFileMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkMessageReadMutation,
  useMarkRoomReadMutation,
  useSetTypingMutation,
  useSetOnlineStatusMutation,
} = chatApi;

// Add getRooms method to chatApi for backward compatibility
(chatApi as any).getRooms = chatApiDirect.getRooms;


// Direct API methods for screen compatibility
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const chatClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

chatClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Direct methods for screens
export const chatApiDirect = {
  async getRooms(token: string): Promise<ChatRoom[]> {
    const response = await chatClient.get('/chat/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  async getRoom(token: string, roomId: string): Promise<ChatRoom> {
    const response = await chatClient.get(`/chat/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getMessages(token: string, roomId: string): Promise<ChatMessage[]> {
    const response = await chatClient.get(`/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  async sendMessage(token: string, roomId: string, data: { content: string; replyToId?: number }): Promise<ChatMessage> {
    const response = await chatClient.post(`/chat/rooms/${roomId}/messages`, {
      message_type: 'text',
      content: data.content,
      reply_to: data.replyToId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async sendImage(token: string, roomId: string, imageUri: string): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg'
    } as any);

    const response = await chatClient.post(`/chat/rooms/${roomId}/image`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async markRoomRead(token: string, roomId: string): Promise<void> {
    await chatClient.post(`/chat/rooms/${roomId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

// Re-export for backward compatibility
Object.assign(chatApi, chatApiDirect);
