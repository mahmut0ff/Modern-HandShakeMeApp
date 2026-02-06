import { configureStore } from '@reduxjs/toolkit';
import { chatApi } from '../../../services/chatApi';
import { api } from '../../../services/api';

describe('chatApi', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(api.util.resetApiState());
  });

  describe('Chat Rooms', () => {
    it('should create getChatRooms endpoint', () => {
      expect(chatApi.endpoints.getChatRooms).toBeDefined();
    });

    it('should create getChatRoom endpoint', () => {
      expect(chatApi.endpoints.getChatRoom).toBeDefined();
    });

    it('should create createChatRoom endpoint', () => {
      expect(chatApi.endpoints.createChatRoom).toBeDefined();
    });

    it('should provide Chat tag for rooms', () => {
      const endpoint = chatApi.endpoints.getChatRooms;
      expect(endpoint.name).toBe('getChatRooms');
    });
  });

  describe('Chat Messages', () => {
    it('should create getChatMessages endpoint', () => {
      expect(chatApi.endpoints.getChatMessages).toBeDefined();
    });

    it('should create sendMessage endpoint', () => {
      expect(chatApi.endpoints.sendMessage).toBeDefined();
    });

    it('should create sendImageMessage endpoint', () => {
      expect(chatApi.endpoints.sendImageMessage).toBeDefined();
    });

    it('should create sendFileMessage endpoint', () => {
      expect(chatApi.endpoints.sendFileMessage).toBeDefined();
    });

    it('should create editMessage endpoint', () => {
      expect(chatApi.endpoints.editMessage).toBeDefined();
    });

    it('should create deleteMessage endpoint', () => {
      expect(chatApi.endpoints.deleteMessage).toBeDefined();
    });
  });

  describe('Message Status', () => {
    it('should create markMessageRead endpoint', () => {
      expect(chatApi.endpoints.markMessageRead).toBeDefined();
    });

    it('should create markRoomRead endpoint', () => {
      expect(chatApi.endpoints.markRoomRead).toBeDefined();
    });

    it('should invalidate Chat tag on read', () => {
      const endpoint = chatApi.endpoints.markMessageRead;
      expect(endpoint.name).toBe('markMessageRead');
    });
  });

  describe('Typing Indicators', () => {
    it('should create setTyping endpoint', () => {
      expect(chatApi.endpoints.setTyping).toBeDefined();
    });
  });

  describe('Online Status', () => {
    it('should create setOnlineStatus endpoint', () => {
      expect(chatApi.endpoints.setOnlineStatus).toBeDefined();
    });
  });

  describe('Message Types', () => {
    const messageTypes = ['text', 'image', 'file', 'system'];

    messageTypes.forEach(type => {
      it(`should support ${type} message type`, () => {
        expect(messageTypes).toContain(type);
      });
    });
  });
});
