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
        url: '/chat/messages',
        method: 'POST',
        body: data,
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
          url: `/chat/rooms/${roomId}/send-image`,
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
          url: `/chat/rooms/${roomId}/send-file`,
          method: 'POST',
          body: file,
          formData: true,
        };
      },
      invalidatesTags: ['Chat'],
    }),

    editMessage: builder.mutation<ChatMessage, { id: number; content: string }>({
      query: ({ id, content }) => ({
        url: `/chat/messages/${id}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: ['Chat'],
    }),

    deleteMessage: builder.mutation<void, number>({
      query: (id) => ({
        url: `/chat/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    markMessageRead: builder.mutation<void, number>({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Chat'],
      async onQueryStarted(messageId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Send via WebSocket for real-time status update
          websocketService.markMessageRead(messageId);
        } catch (error) {
          console.error('Failed to mark message read via WebSocket:', error);
        }
      },
    }),

    markRoomRead: builder.mutation<void, number>({
      query: (roomId) => ({
        url: `/chat/rooms/${roomId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Typing indicators
    setTyping: builder.mutation<void, { roomId: number; isTyping: boolean }>({
      query: ({ roomId, isTyping }) => ({
        url: `/chat/rooms/${roomId}/typing`,
        method: 'POST',
        body: { is_typing: isTyping },
      }),
      async onQueryStarted({ roomId, isTyping }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Send via WebSocket for real-time typing indicator
          websocketService.setTyping(roomId, isTyping);
        } catch (error) {
          console.error('Failed to set typing via WebSocket:', error);
        }
      },
    }),

    // Online status
    setOnlineStatus: builder.mutation<void, { isOnline: boolean }>({
      query: ({ isOnline }) => ({
        url: '/chat/online-status',
        method: 'POST',
        body: { is_online: isOnline },
      }),
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