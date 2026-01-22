// Order Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Order {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  city: string;
  address: string;
  hideAddress: boolean;
  budgetType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  budgetMin?: number;
  budgetMax?: number;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  applicationsCount: number;
  viewsCount: number;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export class OrderRepository {
  async create(data: Partial<Order>): Promise<Order> {
    const order: Order = {
      id: uuidv4(),
      clientId: data.clientId!,
      categoryId: data.categoryId!,
      title: data.title!,
      description: data.description!,
      city: data.city!,
      address: data.address!,
      hideAddress: data.hideAddress ?? true,
      budgetType: data.budgetType!,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'ACTIVE',
      applicationsCount: 0,
      viewsCount: 0,
      isUrgent: data.isUrgent || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    await putItem({
      ...Keys.order(order.id),
      ...order,
      GSI1PK: `CAT#${order.categoryId}`,
      GSI1SK: `${order.createdAt}#${order.id}`,
      GSI2PK: `STATUS#${order.status}`,
      GSI2SK: `${order.createdAt}#${order.id}`,
    });
    
    return order;
  }
  
  async findById(orderId: string): Promise<Order | null> {
    const item = await getItem(Keys.order(orderId));
    return item as Order | null;
  }
  
  async findByStatus(status: string, limit = 20): Promise<Order[]> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `STATUS#${status}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Order[];
  }
  
  async findByCategory(categoryId: string, limit = 20): Promise<Order[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CAT#${categoryId}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Order[];
  }
  
  async update(orderId: string, data: Partial<Order>): Promise<Order> {
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
      Key: Keys.order(orderId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Order;
  }
  
  async delete(orderId: string): Promise<void> {
    await deleteItem(Keys.order(orderId));
  }

  async findByClient(clientId: string, limit = 50): Promise<Order[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${clientId}`,
        ':sk': 'ORDER#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Order[];
  }
}
