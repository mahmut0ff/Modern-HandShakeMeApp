// Portfolio Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface PortfolioItem {
  id: string;
  masterId: string;
  title: string;
  description: string;
  images: string[];
  skills: string[];
  cost?: number;
  durationDays?: number;
  categoryId?: string;
  clientReview?: string;
  clientRating?: number;
  isPublic: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioFilters {
  masterId?: string;
  categoryId?: string;
  skills?: string[];
  isPublic?: boolean;
  includePrivate?: boolean;
  sortBy?: 'recent' | 'popular' | 'rating';
  page?: number;
  pageSize?: number;
}

export class PortfolioRepository {
  async createItem(data: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const item: PortfolioItem = {
      id: uuidv4(),
      masterId: data.masterId!,
      title: data.title!,
      description: data.description!,
      images: data.images || [],
      skills: data.skills || [],
      cost: data.cost,
      durationDays: data.durationDays,
      categoryId: data.categoryId,
      clientReview: data.clientReview,
      clientRating: data.clientRating,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `USER#${item.masterId}`,
      SK: `PORTFOLIO#${item.id}`,
      ...item,
      GSI1PK: `PORTFOLIO#${item.categoryId || 'UNCATEGORIZED'}`,
      GSI1SK: `${item.createdAt}#${item.id}`,
      GSI2PK: `PORTFOLIO#${item.isPublic ? 'PUBLIC' : 'PRIVATE'}`,
      GSI2SK: `${item.viewsCount.toString().padStart(10, '0')}#${item.id}`,
    });
    
    return item;
  }
  
  async findItemById(itemId: string, masterId: string): Promise<PortfolioItem | null> {
    const item = await getItem({
      PK: `USER#${masterId}`,
      SK: `PORTFOLIO#${itemId}`,
    });
    
    return item as PortfolioItem | null;
  }
  
  async findMasterItems(masterId: string, filters: PortfolioFilters = {}): Promise<{
    items: PortfolioItem[];
    total: number;
  }> {
    const {
      categoryId,
      skills,
      isPublic,
      includePrivate = false,
      sortBy = 'recent',
      page = 1,
      pageSize = 20
    } = filters;
    
    // Get all portfolio items for the master
    let items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${masterId}`,
        ':sk': 'PORTFOLIO#',
      },
    });
    
    let portfolioItems = items as PortfolioItem[];
    
    // Apply filters
    if (categoryId) {
      portfolioItems = portfolioItems.filter(item => item.categoryId === categoryId);
    }
    
    if (isPublic !== undefined) {
      portfolioItems = portfolioItems.filter(item => item.isPublic === isPublic);
    } else if (!includePrivate) {
      portfolioItems = portfolioItems.filter(item => item.isPublic);
    }
    
    if (skills && skills.length > 0) {
      portfolioItems = portfolioItems.filter(item =>
        skills.some(skill => item.skills.includes(skill))
      );
    }
    
    // Sort items
    switch (sortBy) {
      case 'popular':
        portfolioItems.sort((a, b) => b.viewsCount - a.viewsCount);
        break;
      case 'rating':
        portfolioItems.sort((a, b) => {
          const aRating = a.clientRating || 0;
          const bRating = b.clientRating || 0;
          return bRating - aRating;
        });
        break;
      case 'recent':
      default:
        portfolioItems.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    const total = portfolioItems.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = portfolioItems.slice(startIndex, startIndex + pageSize);
    
    return {
      items: paginatedItems,
      total
    };
  }
  
  async findPublicItems(filters: PortfolioFilters = {}): Promise<{
    items: PortfolioItem[];
    total: number;
  }> {
    const {
      categoryId,
      skills,
      sortBy = 'recent',
      page = 1,
      pageSize = 20
    } = filters;
    
    let items: PortfolioItem[];
    
    if (categoryId) {
      // Query by category
      const result = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        FilterExpression: 'isPublic = :isPublic',
        ExpressionAttributeValues: {
          ':pk': `PORTFOLIO#${categoryId}`,
          ':isPublic': true,
        },
      });
      items = result as PortfolioItem[];
    } else {
      // Query public items
      const result = await queryItems({
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'PORTFOLIO#PUBLIC',
        },
      });
      items = result as PortfolioItem[];
    }
    
    // Apply skill filter
    if (skills && skills.length > 0) {
      items = items.filter(item =>
        skills.some(skill => item.skills.includes(skill))
      );
    }
    
    // Sort items
    switch (sortBy) {
      case 'popular':
        items.sort((a, b) => b.viewsCount - a.viewsCount);
        break;
      case 'rating':
        items.sort((a, b) => {
          const aRating = a.clientRating || 0;
          const bRating = b.clientRating || 0;
          return bRating - aRating;
        });
        break;
      case 'recent':
      default:
        items.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);
    
    return {
      items: paginatedItems,
      total
    };
  }
  
  async updateItem(itemId: string, masterId: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'id' && key !== 'masterId' && key !== 'createdAt') {
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
        PK: `USER#${masterId}`,
        SK: `PORTFOLIO#${itemId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as PortfolioItem;
  }
  
  async deleteItem(itemId: string, masterId: string): Promise<void> {
    await deleteItem({
      PK: `USER#${masterId}`,
      SK: `PORTFOLIO#${itemId}`,
    });
  }
  
  async incrementViewCount(itemId: string, masterId: string): Promise<PortfolioItem> {
    const updated = await updateItem({
      Key: {
        PK: `USER#${masterId}`,
        SK: `PORTFOLIO#${itemId}`,
      },
      UpdateExpression: 'ADD viewsCount :inc SET #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': new Date().toISOString(),
      },
    });
    
    return updated as PortfolioItem;
  }
  
  async countMasterItems(masterId: string): Promise<number> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${masterId}`,
        ':sk': 'PORTFOLIO#',
      },
      Select: 'COUNT',
    });
    
    return items.length;
  }
  
  async findItemsBySkills(skills: string[], limit = 20): Promise<PortfolioItem[]> {
    // Get public items and filter by skills
    const result = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PORTFOLIO#PUBLIC',
      },
      Limit: limit * 2, // Get more to filter
    });
    
    const items = result as PortfolioItem[];
    
    return items.filter(item =>
      skills.some(skill => item.skills.includes(skill))
    ).slice(0, limit);
  }
}