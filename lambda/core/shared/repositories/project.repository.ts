// Project Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';

export interface Project {
  id: string;
  orderId: string;
  clientId: string;
  masterId: string;
  applicationId?: string;
  deadline?: string;
  title: string;
  description: string;
  budget: number;
  agreedPrice: number;
  currency: string;
  status: 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'REVISION' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED' | 'DISPUTED';
  progress: number;
  startDate?: string;
  endDate?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectRepository {
  async createProject(data: Partial<Project>): Promise<Project> {
    const project: Project = {
      id: uuidv4(),
      orderId: data.orderId!,
      clientId: data.clientId!,
      masterId: data.masterId!,
      title: data.title!,
      description: data.description!,
      budget: data.budget!,
      agreedPrice: data.agreedPrice || data.budget!,
      currency: data.currency || 'KGS',
      status: data.status || 'NEW',
      progress: data.progress || 0,
      startDate: data.startDate,
      endDate: data.endDate,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      notes: data.notes,
      cancelledAt: data.cancelledAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `PROJECT#${project.id}`,
      SK: 'DETAILS',
      ...project,
      GSI1PK: `CLIENT#${project.clientId}`,
      GSI1SK: `PROJECT#${project.createdAt}#${project.id}`,
      GSI2PK: `MASTER#${project.masterId}`,
      GSI2SK: `PROJECT#${project.createdAt}#${project.id}`,
    });
    
    return project;
  }
  
  async findById(projectId: string): Promise<Project | null> {
    const item = await getItem({
      PK: `PROJECT#${projectId}`,
      SK: 'DETAILS',
    });
    
    return item as Project | null;
  }
  
  async findProjectById(projectId: string): Promise<Project | null> {
    return this.findById(projectId);
  }
  
  async findByUser(userId: string, limit = 50): Promise<Project[]> {
    // First try as client
    const clientProjects = await this.findClientProjects(userId, limit);
    
    // Then try as master
    const masterProjects = await this.findMasterProjects(userId, limit);
    
    // Combine and sort by creation date
    const allProjects = [...clientProjects, ...masterProjects];
    return allProjects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  }
  
  async findByMaster(masterId: string, limit = 50): Promise<Project[]> {
    return this.findMasterProjects(masterId, limit);
  }
  
  async findClientProjects(clientId: string, limit = 50): Promise<Project[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CLIENT#${clientId}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Project[];
  }
  
  async findMasterProjects(masterId: string, limit = 50): Promise<Project[]> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Project[];
  }
  
  async update(projectId: string, updates: Partial<Project>): Promise<Project> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
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
        PK: `PROJECT#${projectId}`,
        SK: 'DETAILS',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Project;
  }
  
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    return this.update(projectId, updates);
  }
  
  async updateProjectStatus(projectId: string, status: Project['status']): Promise<Project> {
    const updates: Partial<Project> = { status };
    
    if (status === 'COMPLETED') {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    }
    
    if (status === 'IN_PROGRESS' && !updates.startedAt) {
      updates.startedAt = new Date().toISOString();
    }
    
    return this.update(projectId, updates);
  }
  
  // Alias for compatibility
  async create(data: Partial<Project>): Promise<Project> {
    return this.createProject(data);
  }
}