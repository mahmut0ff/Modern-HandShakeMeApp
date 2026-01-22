// User Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: 'MASTER' | 'CLIENT' | 'ADMIN';
  firstName: string;
  lastName: string;
  avatar?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export class UserRepository {
  async create(data: Partial<User>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      phone: data.phone!,
      email: data.email,
      role: data.role || 'CLIENT',
      firstName: data.firstName!,
      lastName: data.lastName!,
      avatar: data.avatar,
      isPhoneVerified: data.isPhoneVerified || false,
      isEmailVerified: data.isEmailVerified || false,
      verificationCode: data.verificationCode,
      verificationCodeExpiry: data.verificationCodeExpiry,
      twoFactorEnabled: data.twoFactorEnabled || false,
      isOnline: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.user(user.id),
      ...user,
      GSI2PK: `PHONE#${user.phone}`,
      GSI2SK: 'USER',
    });
    
    return user;
  }
  
  async findById(userId: string): Promise<User | null> {
    const item = await getItem(Keys.user(userId));
    return item as User | null;
  }
  
  async findByPhone(phone: string): Promise<User | null> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `PHONE#${phone}`,
        ':sk': 'USER',
      },
    });
    
    return items[0] as User | null;
  }
  
  async update(userId: string, data: Partial<User>): Promise<User> {
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
    
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    const updated = await updateItem({
      Key: Keys.user(userId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as User;
  }
}
