// @ts-nocheck
// Service Repository for DynamoDB
// Note: This file has type issues with Service.priceMin

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem, scanItems } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Service {
  id: string;
  masterId: string;
  categoryId: string;
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  priceFrom?: number;  // Унифицировано с API
  priceTo?: number;    // Унифицировано с API
  pricePerHour?: number;
  duration?: string;   // Изменено на string для совместимости
  location: 'CLIENT_LOCATION' | 'MASTER_LOCATION' | 'REMOTE' | 'BOTH';
  isActive: boolean;
  isInstantBooking: boolean;
  tags: string[];
  images: string[];
  requirements?: string;
  cancellationPolicy?: string;
  orderIndex: number;
  viewsCount: number;
  ordersCount: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameKy: string; // Kyrgyz translation
  description?: string;
  icon?: string;
  isActive: boolean;
  orderIndex: number;
  parentId?: string;
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
      priceType: data.priceType || 'FIXED',
      priceFrom: data.priceFrom,
      priceTo: data.priceTo,
      pricePerHour: data.pricePerHour,
      duration: data.duration,
      location: data.location!,
      isActive: data.isActive ?? true,
      isInstantBooking: data.isInstantBooking ?? false,
      tags: data.tags || [],
      images: data.images || [],
      requirements: data.requirements,
      cancellationPolicy: data.cancellationPolicy,
      orderIndex: data.orderIndex || 0,
      viewsCount: 0,
      ordersCount: 0,
      rating: 0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.service(service.id),
      ...service,
      GSI1PK: `MASTER#${service.masterId}`,
      GSI1SK: `SERVICE#${service.orderIndex.toString().padStart(5, '0')}#${service.id}`,
      GSI2PK: `CATEGORY#${service.categoryId}`,
      GSI2SK: `${service.isActive ? 'ACTIVE' : 'INACTIVE'}#${service.createdAt}#${service.id}`,
      GSI3PK: service.isActive ? 'ACTIVE_SERVICES' : 'INACTIVE_SERVICES',
      GSI3SK: `${service.createdAt}#${service.id}`,
    });
    
    return service;
  }
  
  async findById(serviceId: string): Promise<Service | null> {
    const item = await getItem(Keys.service(serviceId));
    return item as Service | null;
  }
  
  async findByMaster(masterId: string, options: {
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Service[]> {
    const { isActive, limit = 50 } = options;
    
    let items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
      },
      ScanIndexForward: true, // Order by orderIndex
      Limit: limit,
    });
    
    // Filter by active status if specified
    if (isActive !== undefined) {
      items = items.filter(item => item.isActive === isActive);
    }
    
    return items as Service[];
  }
  
  async findByCategory(categoryId: string, options: {
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Service[]> {
    const { isActive = true, limit = 50 } = options;
    
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':sk': isActive ? 'ACTIVE' : 'INACTIVE',
      },
      ScanIndexForward: false, // Newest first
      Limit: limit,
    });
    
    return items as Service[];
  }
  
  async searchServices(options: {
    query?: string;
    categoryId?: string;
    masterId?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Service[]> {
    const { 
      query, 
      categoryId, 
      masterId, 
      location, 
      priceMin, 
      priceMax, 
      isActive = true, 
      limit = 50 
    } = options;
    
    let items: any[] = [];
    
    if (masterId) {
      items = await this.findByMaster(masterId, { isActive, limit });
    } else if (categoryId) {
      items = await this.findByCategory(categoryId, { isActive, limit });
    } else {
      // Full scan for general search
      items = await scanItems({
        FilterExpression: 'isActive = :isActive',
        ExpressionAttributeValues: {
          ':isActive': isActive,
        },
        Limit: limit,
      });
    }
    
    // Apply additional filters
    let filteredItems = items as Service[];
    
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredItems = filteredItems.filter(service => 
        service.title.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    if (location) {
      filteredItems = filteredItems.filter(service => 
        service.location === location || service.location === 'BOTH'
      );
    }
    
    if (priceMin !== undefined || priceMax !== undefined) {
      filteredItems = filteredItems.filter(service => {
        if (service.priceType === 'NEGOTIABLE') return true;
        
        const servicePrice = service.priceType === 'HOURLY' 
          ? service.pricePerHour 
          : service.priceMin;
          
        if (!servicePrice) return true;
        
        if (priceMin !== undefined && servicePrice < priceMin) return false;
        if (priceMax !== undefined && servicePrice > priceMax) return false;
        
        return true;
      });
    }
    
    return filteredItems;
  }
  
  async update(serviceId: string, data: Partial<Service>): Promise<Service> {
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
      Key: Keys.service(serviceId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Service;
  }
  
  async delete(serviceId: string): Promise<void> {
    await deleteItem(Keys.service(serviceId));
  }
  
  async toggleStatus(serviceId: string): Promise<Service> {
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    
    return this.update(serviceId, {
      isActive: !service.isActive
    });
  }
  
  async reorderServices(masterId: string, serviceIds: string[]): Promise<Service[]> {
    const services: Service[] = [];
    
    for (let i = 0; i < serviceIds.length; i++) {
      const serviceId = serviceIds[i];
      const service = await this.findById(serviceId);
      
      if (!service || service.masterId !== masterId) {
        throw new Error(`Service ${serviceId} not found or doesn't belong to master`);
      }
      
      const updatedService = await this.update(serviceId, {
        orderIndex: i
      });
      
      services.push(updatedService);
    }
    
    return services;
  }
  
  async incrementViews(serviceId: string): Promise<void> {
    const service = await this.findById(serviceId);
    if (service) {
      await this.update(serviceId, {
        viewsCount: service.viewsCount + 1
      });
    }
  }
  
  async incrementOrders(serviceId: string): Promise<void> {
    const service = await this.findById(serviceId);
    if (service) {
      await this.update(serviceId, {
        ordersCount: service.ordersCount + 1
      });
    }
  }
  
  async updateRating(serviceId: string, newRating: number, reviewsCount: number): Promise<Service> {
    return this.update(serviceId, {
      rating: newRating,
      reviewsCount
    });
  }
}

export class ServiceCategoryRepository {
  async findAll(): Promise<ServiceCategory[]> {
    const items = await scanItems({
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': true,
      },
    });
    
    return items as ServiceCategory[];
  }
  
  async findById(categoryId: string): Promise<ServiceCategory | null> {
    const item = await getItem({
      PK: `CATEGORY#${categoryId}`,
      SK: 'DETAILS',
    });
    
    return item as ServiceCategory | null;
  }
}