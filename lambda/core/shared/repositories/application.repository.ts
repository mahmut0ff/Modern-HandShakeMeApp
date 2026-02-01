// Application Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { Application, CreateApplicationRequest, UpdateApplicationRequest } from '../types';

export class ApplicationRepository {
  async create(masterId: string, data: CreateApplicationRequest): Promise<Application> {
    const application: Application = {
      id: uuidv4(),
      orderId: data.orderId,
      masterId,
      coverLetter: data.coverLetter,
      proposedPrice: data.proposedPrice,
      proposedDurationDays: data.proposedDurationDays,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store application under order
    await putItem({
      ...Keys.application(application.orderId, application.id),
      ...application,
      GSI1PK: `MASTER#${masterId}`,
      GSI1SK: `APP#${application.createdAt}#${application.id}`,
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
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':sk': 'APP#',
      },
      ScanIndexForward: false,
    });
    
    return items as Application[];
  }
  
  async update(orderId: string, applicationId: string, data: UpdateApplicationRequest): Promise<Application> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    // Always update the updatedAt field
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
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
  
  async updateStatus(orderId: string, applicationId: string, status: Application['status']): Promise<Application> {
    const updated = await updateItem({
      Key: Keys.application(orderId, applicationId),
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    });
    
    return updated as Application;
  }
  
  async markViewed(orderId: string, applicationId: string): Promise<Application> {
    const now = new Date().toISOString();
    const updated = await updateItem({
      Key: Keys.application(orderId, applicationId),
      UpdateExpression: 'SET #viewedAt = :viewedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#viewedAt': 'viewedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':viewedAt': now,
        ':updatedAt': now,
      },
    });
    
    return updated as Application;
  }
  
  async delete(orderId: string, applicationId: string): Promise<void> {
    await deleteItem(Keys.application(orderId, applicationId));
  }
  
  async rejectAllOtherApplications(orderId: string, acceptedApplicationId: string): Promise<void> {
    // Get all applications for the order
    const applications = await this.findByOrder(orderId);
    
    // Update all other applications to REJECTED
    const updatePromises = applications
      .filter(app => app.id !== acceptedApplicationId && app.status === 'PENDING')
      .map(app => this.updateStatus(orderId, app.id, 'REJECTED'));
    
    await Promise.all(updatePromises);
  }
}
