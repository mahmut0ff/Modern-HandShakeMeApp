import { PutCommand, GetCommand, UpdateCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Category, Skill } from '../types';
import { dynamodb as docClient } from '../db/dynamodb-client';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export class CategoryRepository {
  // Category methods
  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const category: Category = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`,
        GSI1PK: 'CATEGORIES',
        GSI1SK: `ORDER#${data.order.toString().padStart(3, '0')}#${id}`,
        GSI2PK: 'CATEGORY_STATUS',
        GSI2SK: `${data.isActive ? 'ACTIVE' : 'INACTIVE'}#${data.order.toString().padStart(3, '0')}`,
        ...category
      }
    }));

    return category;
  }

  async getCategory(id: string): Promise<Category | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`
      }
    }));

    return result.Item as Category || null;
  }

  async listCategories(filters?: {
    isActive?: boolean;
    limit?: number;
  }): Promise<Category[]> {
    const limit = filters?.limit || 50;

    if (filters?.isActive !== undefined) {
      // Use GSI2 to filter by active status
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': 'CATEGORY_STATUS',
          ':sk': filters.isActive ? 'ACTIVE#' : 'INACTIVE#'
        },
        Limit: limit,
        ScanIndexForward: true // Order by order field
      }));

      return (result.Items || []) as Category[];
    }

    // Get all categories ordered by order field
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'CATEGORIES'
      },
      Limit: limit,
      ScanIndexForward: true
    }));

    return (result.Items || []) as Category[];
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Update GSI keys if order or isActive changed
    if (updates.order !== undefined) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `ORDER#${updates.order.toString().padStart(3, '0')}#${id}`;
    }

    if (updates.isActive !== undefined || updates.order !== undefined) {
      const currentCategory = await this.getCategory(id);
      const newOrder = updates.order !== undefined ? updates.order : currentCategory?.order || 0;
      const newIsActive = updates.isActive !== undefined ? updates.isActive : currentCategory?.isActive || true;

      updateExpressions.push('GSI2SK = :gsi2sk');
      expressionAttributeValues[':gsi2sk'] = `${newIsActive ? 'ACTIVE' : 'INACTIVE'}#${newOrder.toString().padStart(3, '0')}`;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Category;
  }

  // Skill methods
  async createSkill(data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const skill: Skill = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CATEGORY#${data.categoryId}`,
        SK: `SKILL#${id}`,
        GSI1PK: 'SKILLS',
        GSI1SK: `CATEGORY#${data.categoryId}#${data.name}`,
        GSI2PK: 'SKILL_STATUS',
        GSI2SK: `${data.isActive ? 'ACTIVE' : 'INACTIVE'}#${data.name}`,
        ...skill
      }
    }));

    return skill;
  }

  async getSkill(id: string, categoryId: string): Promise<Skill | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: `SKILL#${id}`
      }
    }));

    return result.Item as Skill || null;
  }

  async getSkillById(id: string): Promise<Skill | null> {
    // Since we need to find by ID across all categories, use GSI1
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':pk': 'SKILLS',
        ':id': id
      },
      Limit: 1
    }));

    return result.Items?.[0] as Skill || null;
  }

  async getCategorySkills(categoryId: string, filters?: {
    isActive?: boolean;
    search?: string;
    limit?: number;
  }): Promise<Skill[]> {
    const limit = filters?.limit || 100;

    let keyConditionExpression = 'PK = :pk AND begins_with(SK, :sk)';
    const expressionAttributeValues: any = {
      ':pk': `CATEGORY#${categoryId}`,
      ':sk': 'SKILL#'
    };

    let filterExpression = '';
    if (filters?.isActive !== undefined) {
      filterExpression = 'isActive = :isActive';
      expressionAttributeValues[':isActive'] = filters.isActive;
    }

    if (filters?.search) {
      filterExpression = filterExpression ?
        `${filterExpression} AND contains(#name, :search)` :
        'contains(#name, :search)';
      expressionAttributeValues[':search'] = filters.search.toLowerCase();
    }

    const queryParams: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: true
    };

    if (filterExpression) {
      queryParams.FilterExpression = filterExpression;
    }

    if (filters?.search) {
      queryParams.ExpressionAttributeNames = { '#name': 'name' };
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return (result.Items || []) as Skill[];
  }

  async listAllSkills(filters?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
  }): Promise<Skill[]> {
    const limit = filters?.limit || 100;

    if (filters?.categoryId) {
      return this.getCategorySkills(filters.categoryId, {
        isActive: filters.isActive,
        search: filters.search,
        limit
      });
    }

    // Query all skills using GSI1
    let keyConditionExpression = 'GSI1PK = :pk';
    const expressionAttributeValues: any = {
      ':pk': 'SKILLS'
    };

    if (filters?.categoryId) {
      keyConditionExpression += ' AND begins_with(GSI1SK, :categoryPrefix)';
      expressionAttributeValues[':categoryPrefix'] = `CATEGORY#${filters.categoryId}#`;
    }

    let filterExpression = '';
    if (filters?.isActive !== undefined) {
      filterExpression = 'isActive = :isActive';
      expressionAttributeValues[':isActive'] = filters.isActive;
    }

    if (filters?.search) {
      filterExpression = filterExpression ?
        `${filterExpression} AND contains(#name, :search)` :
        'contains(#name, :search)';
      expressionAttributeValues[':search'] = filters.search.toLowerCase();
    }

    const queryParams: any = {
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: true
    };

    if (filterExpression) {
      queryParams.FilterExpression = filterExpression;
    }

    if (filters?.search) {
      queryParams.ExpressionAttributeNames = { '#name': 'name' };
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return (result.Items || []) as Skill[];
  }

  async updateSkill(id: string, categoryId: string, updates: Partial<Skill>): Promise<Skill> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = { ':updatedAt': now };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'categoryId' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Update GSI keys if name or isActive changed
    if (updates.name !== undefined) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `CATEGORY#${categoryId}#${updates.name}`;
    }

    if (updates.isActive !== undefined || updates.name !== undefined) {
      const currentSkill = await this.getSkill(id, categoryId);
      const newName = updates.name !== undefined ? updates.name : currentSkill?.name || '';
      const newIsActive = updates.isActive !== undefined ? updates.isActive : currentSkill?.isActive || true;

      updateExpressions.push('GSI2SK = :gsi2sk');
      expressionAttributeValues[':gsi2sk'] = `${newIsActive ? 'ACTIVE' : 'INACTIVE'}#${newName}`;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: `SKILL#${id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Skill;
  }

  // Utility method to seed initial categories
  async seedCategories(): Promise<void> {
    const categories = [
      { name: 'Ремонт и строительство', icon: 'hammer', order: 1 },
      { name: 'Красота и здоровье', icon: 'spa', order: 2 },
      { name: 'Уборка и клининг', icon: 'cleaning', order: 3 },
      { name: 'Грузоперевозки', icon: 'truck', order: 4 },
      { name: 'IT и технологии', icon: 'computer', order: 5 },
      { name: 'Репетиторство', icon: 'book', order: 6 },
      { name: 'Фото и видео', icon: 'camera', order: 7 },
      { name: 'Авто услуги', icon: 'car', order: 8 },
      { name: 'Юридические услуги', icon: 'gavel', order: 9 },
      { name: 'Другое', icon: 'more', order: 10 },
    ];

    // Check if categories already exist
    const existingCategories = await this.listCategories({ limit: 1 });
    if (existingCategories.length > 0) {
      return; // Categories already seeded
    }

    // Create categories in batches
    const batchSize = 25;
    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);

      const writeRequests = batch.map(categoryData => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const category: Category = {
          id,
          ...categoryData,
          isActive: true,
          createdAt: now,
          updatedAt: now
        };

        return {
          PutRequest: {
            Item: {
              PK: 'CATEGORY',
              SK: `CATEGORY#${id}`,
              GSI1PK: 'CATEGORIES',
              GSI1SK: `ORDER#${categoryData.order.toString().padStart(3, '0')}#${id}`,
              GSI2PK: 'CATEGORY_STATUS',
              GSI2SK: `ACTIVE#${categoryData.order.toString().padStart(3, '0')}`,
              ...category
            }
          }
        };
      });

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: writeRequests
        }
      }));
    }
  }
}