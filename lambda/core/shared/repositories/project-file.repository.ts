// Project File Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'photo' | 'document' | 'video' | 'other';
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedBy: 'client' | 'master';
  uploadedByUserId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProjectFileRepository {
  async create(data: Partial<ProjectFile>): Promise<ProjectFile> {
    const file: ProjectFile = {
      id: uuidv4(),
      projectId: data.projectId!,
      fileName: data.fileName!,
      fileUrl: data.fileUrl!,
      fileType: data.fileType || 'other',
      fileSize: data.fileSize || 0,
      mimeType: data.mimeType || 'application/octet-stream',
      thumbnailUrl: data.thumbnailUrl,
      description: data.description,
      uploadedBy: data.uploadedBy!,
      uploadedByUserId: data.uploadedByUserId!,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `PROJECT#${file.projectId}`,
      SK: `FILE#${file.id}`,
      ...file,
      GSI1PK: `USER#${file.uploadedByUserId}`,
      GSI1SK: `FILE#${file.createdAt}#${file.id}`,
      GSI2PK: `FILETYPE#${file.fileType}`,
      GSI2SK: `${file.createdAt}#${file.id}`,
    });
    
    return file;
  }
  
  async findById(fileId: string, projectId: string): Promise<ProjectFile | null> {
    const item = await getItem({
      PK: `PROJECT#${projectId}`,
      SK: `FILE#${fileId}`,
    });
    
    return item as ProjectFile | null;
  }
  
  async findByProject(projectId: string, limit = 50): Promise<ProjectFile[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PROJECT#${projectId}`,
        ':sk': 'FILE#',
      },
      ScanIndexForward: false, // Latest first
      Limit: limit,
    });
    
    return items as ProjectFile[];
  }
  
  async findByUser(userId: string, limit = 50): Promise<ProjectFile[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
      ScanIndexForward: false, // Latest first
      Limit: limit,
    });
    
    return items as ProjectFile[];
  }
  
  async findByType(fileType: ProjectFile['fileType'], limit = 50): Promise<ProjectFile[]> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `FILETYPE#${fileType}`,
      },
      ScanIndexForward: false, // Latest first
      Limit: limit,
    });
    
    return items as ProjectFile[];
  }
  
  async update(fileId: string, projectId: string, updates: Partial<ProjectFile>): Promise<ProjectFile> {
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
    
    const updated = await updateItem({
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: `FILE#${fileId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as ProjectFile;
  }
  
  async delete(fileId: string, projectId: string): Promise<void> {
    await deleteItem({
      PK: `PROJECT#${projectId}`,
      SK: `FILE#${fileId}`,
    });
  }
  
  async countByProject(projectId: string): Promise<number> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PROJECT#${projectId}`,
        ':sk': 'FILE#',
      },
      Select: 'COUNT',
    });
    
    return items.length;
  }
}