// Chat Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface ChatRoom {
  id: string;
  projectId?: string;
  participants: string[];
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount: Record<string, number>;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: string;
}

export class ChatRepository {
  async createRoom(data: Partial<ChatRoom>): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: uuidv4(),
      projectId: data.projectId,
      participants: data.participants!,
      lastMessageAt: new Date().toISOString(),
      unreadCount: {},
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.chatRoom(room.id),
      ...room,
    });
    
    return room;
  }
  
  async findRoomById(roomId: string): Promise<ChatRoom | null> {
    const item = await getItem(Keys.chatRoom(roomId));
    return item as ChatRoom | null;
  }
  
  async createMessage(data: Partial<Message>): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId!,
      senderId: data.senderId!,
      type: data.type || 'TEXT',
      content: data.content!,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.message(message.roomId, message.id),
      ...message,
    });
    
    return message;
  }
  
  async findMessages(roomId: string, limit = 50): Promise<Message[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'MSG#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Message[];
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
    
    const updated = await updateItem({
      Key: Keys.chatRoom(roomId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as ChatRoom;
  }

  async findRoomsByUser(userId: string, limit = 50): Promise<ChatRoom[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}#ROOMS`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as ChatRoom[];
  }
}
