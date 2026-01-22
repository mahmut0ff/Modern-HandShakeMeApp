// Service Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Service {
  id: string;
  masterId: string;
  categoryId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  duration: string;
  isActive: boolean;
  order: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export class ServiceRepository {
  async create(data: Partial<Service>): Promise<Service> {
    const service: Service = {
      id: uuidv4(),
      masterId: data.masterId!,
      categoryId: data.categoryId!,
      title: data.title!,
      description: data.description!,
      priceFrom: data.priceFrom!,
      priceTo: data.priceTo,
      duration: data.duration!,
      isActive: data.isActive ?? true,
      order: data.order || 0,
      images: data.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.service(service.masterId, service.id),
      ...service,
    });
    
    return service;
  }
  
  async findById(masterId: string, serviceId: string): Promise<Service | null> {
    const item = await getItem(Keys.service(masterId, serviceId));
    return item as Service | null;
  }
  
  async findByMaster(masterId: string): Promise<Service[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${masterId}`,
        ':sk': 'SERVICE#',
      },
    });
    
    return items as Service[];
  }
  
  async update(masterId: string, serviceId: string, data: Partial<Service>): Promise<Service> {
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
      Key: Keys.service(masterId, serviceId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Service;
  }
  
  async delete(masterId: string, serviceId: string): Promise<void> {
    await deleteItem(Keys.service(masterId, serviceId));
  }
}
