// Project Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Project {
  id: string;
  orderId: string;
  masterId: string;
  clientId: string;
  applicationId?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'REVISION' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  progress: number;
  agreedPrice: number;
  deadline: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectRepository {
  async create(data: Partial<Project>): Promise<Project> {
    const project: Project = {
      id: uuidv4(),
      orderId: data.orderId!,
      masterId: data.masterId!,
      clientId: data.clientId!,
      applicationId: data.applicationId,
      status: 'NEW',
      priority: data.priority || 'MEDIUM',
      progress: 0,
      agreedPrice: data.agreedPrice!,
      deadline: data.deadline!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.project(project.id),
      ...project,
    });
    
    // Store in master's projects
    await putItem({
      PK: `USER#${project.masterId}`,
      SK: `PROJECT#${project.createdAt}#${project.id}`,
      ...project,
    });
    
    // Store in client's projects
    await putItem({
      PK: `USER#${project.clientId}`,
      SK: `PROJECT#${project.createdAt}#${project.id}`,
      ...project,
    });
    
    return project;
  }
  
  async findById(projectId: string): Promise<Project | null> {
    const item = await getItem(Keys.project(projectId));
    return item as Project | null;
  }
  
  async findByUser(userId: string): Promise<Project[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PROJECT#',
      },
      ScanIndexForward: false,
    });
    
    return items as Project[];
  }
  
  async update(projectId: string, data: Partial<Project>): Promise<Project> {
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
      Key: Keys.project(projectId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Project;
  }
}
