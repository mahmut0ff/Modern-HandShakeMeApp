// Application Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Application {
  id: string;
  orderId: string;
  masterId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedDurationDays: number;
  status: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  viewedAt?: string;
}

export class ApplicationRepository {
  async create(data: Partial<Application>): Promise<Application> {
    const application: Application = {
      id: uuidv4(),
      orderId: data.orderId!,
      masterId: data.masterId!,
      coverLetter: data.coverLetter!,
      proposedPrice: data.proposedPrice!,
      proposedDurationDays: data.proposedDurationDays!,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.application(application.orderId, application.id),
      ...application,
    });
    
    // Also store in master's applications
    await putItem({
      PK: `USER#${application.masterId}`,
      SK: `APP#${application.createdAt}#${application.id}`,
      ...application,
    });
    
    return application;
  }
  
  async findById(orderId: string, applicationId: string): Promise<Application | null> {
    const item = await getItem(Keys.application(orderId, applicationId));
    return item as Application | null;
  }
  
  async findByOrder(orderId: string): Promise<Application[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`,
        ':sk': 'APP#',
      },
    });
    
    return items as Application[];
  }
  
  async findByMaster(masterId: string): Promise<Application[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${masterId}`,
        ':sk': 'APP#',
      },
      ScanIndexForward: false,
    });
    
    return items as Application[];
  }
  
  async update(orderId: string, applicationId: string, data: Partial<Application>): Promise<Application> {
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
      Key: Keys.application(orderId, applicationId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Application;
  }
}
