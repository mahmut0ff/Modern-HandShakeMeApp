// Chat Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { logger } from '../utils/logger';
import {
  ChatRoom,
  Message,
  ChatParticipant,
  WebSocketConnection,
  MessageWithSender,
  ChatRoomWithParticipants
} from '../types/chat';

export class ChatRepository {
  // Room operations
  async createRoom(data: {
    participants: string[];
    projectId?: string;
    orderId?: string;
  }): Promise<ChatRoom> {
    const roomId = uuidv4();
    const now = new Date().toISOString();

    const room: ChatRoom = {
      id: roomId,
      projectId: data.projectId,
      orderId: data.orderId,
      participants: data.participants,
      lastMessageAt: now,
      unreadCount: {},
      createdAt: now,
    };

    // Create room
    await putItem({
      ...Keys.chatRoom(roomId),
      ...room,
    });

    // Create participant records
    for (const userId of data.participants) {
      const participant: ChatParticipant = {
        roomId,
        userId,
        joinedAt: now,
        unreadCount: 0,
        isActive: true,
      };

      await putItem({
        PK: `USER#${userId}`,
        SK: `ROOM#${roomId}`,
        GSI1PK: `ROOM#${roomId}`,
        GSI1SK: `USER#${userId}`,
        ...participant,
      });
    }

    return room;
  }

  async findRoomById(roomId: string): Promise<ChatRoom | null> {
    const item = await getItem(Keys.chatRoom(roomId));
    return item as ChatRoom | null;
  }

  async findRoomsByUser(userId: string, limit = 50): Promise<ChatRoomWithParticipants[]> {
    // Get user's room participations
    const participations = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ROOM#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });

    const rooms: ChatRoomWithParticipants[] = [];

    for (const participation of participations) {
      const room = await this.findRoomById(participation.roomId);
      if (room) {
        // Get all participants for this room
        const allParticipants = await queryItems({
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `ROOM#${room.id}`,
          },
        });

        // Get message count
        const messages = await queryItems({
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `ROOM#${room.id}`,
            ':sk': 'MSG#',
          },
          Select: 'COUNT',
        });

        rooms.push({
          ...room,
          participants: allParticipants.map((p: any) => ({
            userId: p.userId,
            user: {
              id: p.userId,
              firstName: 'User', // Will be populated by service layer
              lastName: '',
              avatar: undefined,
              isOnline: false,
              lastSeenAt: undefined,
            },
            unreadCount: p.unreadCount || 0,
            lastReadAt: p.lastReadAt,
          })),
          messageCount: messages.length,
        });
      }
    }

    return rooms.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  async updateRoom(roomId: string, data: Partial<ChatRoom>): Promise<ChatRoom> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};

    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined) {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      const existing = await this.findRoomById(roomId);
      return existing!;
    }

    attributeValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';

    const updated = await updateItem({
      Key: Keys.chatRoom(roomId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });

    return updated as ChatRoom;
  }

  // Message operations
  async createMessage(data: {
    roomId: string;
    senderId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }): Promise<Message> {
    const messageId = uuidv4();
    const now = new Date().toISOString();

    const message: Message = {
      id: messageId,
      roomId: data.roomId,
      senderId: data.senderId,
      type: data.type || 'TEXT',
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: data.replyToId,
      isEdited: false,
      isRead: false,
      readBy: {},
      createdAt: now,
    };

    await putItem({
      ...Keys.message(data.roomId, messageId),
      ...message,
    });

    return message;
  }

  async findMessages(roomId: string, limit = 50, lastMessageId?: string): Promise<MessageWithSender[]> {
    const params: any = {
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'MSG#',
      },
      ScanIndexForward: false,
      Limit: limit,
    };

    if (lastMessageId) {
      params.ExclusiveStartKey = {
        PK: `ROOM#${roomId}`,
        SK: `MSG#${lastMessageId}`,
      };
    }

    const items = await queryItems(params);

    // Convert to MessageWithSender (sender info will be populated by service layer)
    return items.map((item: any) => ({
      ...item,
      sender: {
        id: item.senderId,
        firstName: 'User', // Will be populated by service layer
        lastName: '',
        avatar: undefined,
      },
    })) as MessageWithSender[];
  }

  async findMessageById(roomId: string, messageId: string): Promise<Message | null> {
    const item = await getItem(Keys.message(roomId, messageId));
    return item as Message | null;
  }

  async updateMessage(roomId: string, messageId: string, data: Partial<Message>): Promise<Message> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};

    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined) {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      const existing = await this.findMessageById(roomId, messageId);
      return existing!;
    }

    attributeValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';

    const updated = await updateItem({
      Key: Keys.message(roomId, messageId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });

    return updated as Message;
  }

  async deleteMessage(roomId: string, messageId: string): Promise<void> {
    await deleteItem(Keys.message(roomId, messageId));
  }

  async markMessageRead(roomId: string, messageId: string, userId: string): Promise<void> {
    const now = new Date().toISOString();

    await updateItem({
      Key: Keys.message(roomId, messageId),
      UpdateExpression: 'SET readBy.#userId = :timestamp, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#userId': userId,
      },
      ExpressionAttributeValues: {
        ':timestamp': now,
        ':updatedAt': now,
      },
    });
  }

  async markRoomRead(roomId: string, userId: string): Promise<void> {
    const now = new Date().toISOString();

    // Update participant's last read time and reset unread count
    await updateItem({
      Key: {
        PK: `USER#${userId}`,
        SK: `ROOM#${roomId}`,
      },
      UpdateExpression: 'SET lastReadAt = :timestamp, unreadCount = :zero',
      ExpressionAttributeValues: {
        ':timestamp': now,
        ':zero': 0,
      },
    });
  }

  // WebSocket connection operations
  /**
   * Create WebSocket connection record
   * Includes TTL (30 minutes) to automatically clean up stale connections
   */
  async createConnection(connectionId: string, userId: string): Promise<WebSocketConnection> {
    const now = new Date().toISOString();
    const ttlSeconds = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes TTL

    const connection: WebSocketConnection = {
      connectionId,
      userId,
      connectedAt: now,
    };

    await putItem({
      PK: `WS_CONNECTION#${connectionId}`,
      SK: 'DETAILS',
      GSI1PK: `USER#${userId}`,
      GSI1SK: `WS#${connectionId}`,
      ...connection,
      ttl: ttlSeconds, // DynamoDB TTL attribute (lowercase)
    });

    logger.info('WebSocket connection created', { connectionId, userId, ttl: ttlSeconds });

    return connection;
  }

  async findConnection(connectionId: string): Promise<WebSocketConnection | null> {
    const item = await getItem({
      PK: `WS_CONNECTION#${connectionId}`,
      SK: 'DETAILS',
    });
    return item as WebSocketConnection | null;
  }

  async findUserConnections(userId: string): Promise<WebSocketConnection[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WS#',
      },
    });

    return items as WebSocketConnection[];
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await deleteItem({
      PK: `WS_CONNECTION#${connectionId}`,
      SK: 'DETAILS',
    });
  }

  /**
   * Update connection ping timestamp and extend TTL
   * Keeps active connections alive by resetting the 30-minute TTL
   */
  async updateConnectionPing(connectionId: string): Promise<void> {
    const newTtl = Math.floor(Date.now() / 1000) + (30 * 60); // Reset to 30 minutes

    await updateItem({
      Key: {
        PK: `WS_CONNECTION#${connectionId}`,
        SK: 'DETAILS',
      },
      UpdateExpression: 'SET lastPingAt = :timestamp, #ttl = :ttl',
      ExpressionAttributeNames: {
        '#ttl': 'ttl',
      },
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString(),
        ':ttl': newTtl,
      },
    });
  }
}
