// Milestone Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  orderNum: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class MilestoneRepository {
  async create(data: Partial<Milestone>): Promise<Milestone> {
    const milestone: Milestone = {
      id: uuidv4(),
      projectId: data.projectId!,
      title: data.title!,
      description: data.description,
      amount: data.amount!,
      dueDate: data.dueDate,
      orderNum: data.orderNum || 0,
      status: data.status || 'PENDING',
      completedAt: data.completedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `PROJECT#${milestone.projectId}`,
      SK: `MILESTONE#${milestone.id}`,
      ...milestone,
      GSI1PK: `MILESTONE#${milestone.status}`,
      GSI1SK: `${milestone.dueDate || '9999-12-31'}#${milestone.id}`,
    });
    
    return milestone;
  }
  
  async findById(milestoneId: string, projectId: string): Promise<Milestone | null> {
    const item = await getItem({
      PK: `PROJECT#${projectId}`,
      SK: `MILESTONE#${milestoneId}`,
    });
    
    return item as Milestone | null;
  }
  
  async findByProject(projectId: string): Promise<Milestone[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PROJECT#${projectId}`,
        ':sk': 'MILESTONE#',
      },
    });
    
    // Sort by orderNum
    const milestones = items as Milestone[];
    return milestones.sort((a, b) => a.orderNum - b.orderNum);
  }
  
  async update(milestoneId: string, projectId: string, updates: Partial<Milestone>): Promise<Milestone> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'id' && key !== 'projectId' && key !== 'createdAt') {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    // Update GSI1SK if status or dueDate changed
    if (updates.status || updates.dueDate) {
      const currentMilestone = await this.findById(milestoneId, projectId);
      if (currentMilestone) {
        const newStatus = updates.status || currentMilestone.status;
        const newDueDate = updates.dueDate || currentMilestone.dueDate || '9999-12-31';
        
        updateExpressions.push('#gsi1pk = :gsi1pk', '#gsi1sk = :gsi1sk');
        attributeNames['#gsi1pk'] = 'GSI1PK';
        attributeNames['#gsi1sk'] = 'GSI1SK';
        attributeValues[':gsi1pk'] = `MILESTONE#${newStatus}`;
        attributeValues[':gsi1sk'] = `${newDueDate}#${milestoneId}`;
      }
    }
    
    const updated = await updateItem({
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: `MILESTONE#${milestoneId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Milestone;
  }
  
  async delete(milestoneId: string, projectId: string): Promise<void> {
    await deleteItem({
      PK: `PROJECT#${projectId}`,
      SK: `MILESTONE#${milestoneId}`,
    });
  }
  
  async findByStatus(status: Milestone['status'], limit = 50): Promise<Milestone[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MILESTONE#${status}`,
      },
      ScanIndexForward: true, // Sort by due date ascending
      Limit: limit,
    });
    
    return items as Milestone[];
  }
  
  async markCompleted(milestoneId: string, projectId: string): Promise<Milestone> {
    return this.update(milestoneId, projectId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
  }
}