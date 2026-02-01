// User Service for user operations

import { getItem, updateItem } from '../db/dynamodb-client';

export interface User {
  userId: string;
  email?: string;
  phone?: string;
  role: 'CLIENT' | 'MASTER';
  firstName?: string;
  lastName?: string;
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  async findUserById(userId: string): Promise<User | null> {
    const item = await getItem({
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    });
    
    return item as User | null;
  }
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'userId' && key !== 'createdAt') {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    const updated = await updateItem({
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as User;
  }
  
  async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    return this.updateUser(userId, { stripeCustomerId });
  }
}