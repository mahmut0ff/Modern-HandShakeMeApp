// Category Service for category operations

import { getItem, queryItems } from '../db/dynamodb-client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CategoryService {
  async findCategoryById(categoryId: string): Promise<Category | null> {
    const item = await getItem({
      PK: `CATEGORY#${categoryId}`,
      SK: 'DETAILS',
    });
    
    return item as Category | null;
  }
  
  async findActiveCategories(): Promise<Category[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':pk': 'CATEGORIES',
        ':active': true,
      },
    });
    
    return items as Category[];
  }
  
  async validateCategory(categoryId: string): Promise<boolean> {
    const category = await this.findCategoryById(categoryId);
    return category !== null && category.isActive;
  }
}