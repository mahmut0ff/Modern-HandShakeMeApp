// Order File Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';

export interface OrderFile {
  id: string;
  orderId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'photo' | 'video' | 'document';
  thumbnail?: string;
  orderNum: number;
  uploadedBy: string;
  createdAt: string;
}

export class OrderFileRepository {
  async create(data: Partial<OrderFile>): Promise<OrderFile> {
    const file: OrderFile = {
      id: uuidv4(),
      orderId: data.orderId!,
      fileName: data.fileName!,
      fileUrl: data.fileUrl!,
      fileType: data.fileType!,
      thumbnail: data.thumbnail,
      orderNum: data.orderNum || 1,
      uploadedBy: data.uploadedBy!,
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `ORDER#${file.orderId}`,
      SK: `FILE#${file.id}`,
      ...file,
    });
    
    return file;
  }
  
  async findById(fileId: string, orderId: string): Promise<OrderFile | null> {
    const item = await getItem({
      PK: `ORDER#${orderId}`,
      SK: `FILE#${fileId}`,
    });
    
    return item as OrderFile | null;
  }
  
  async findByOrder(orderId: string): Promise<OrderFile[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`,
        ':sk': 'FILE#',
      },
    });
    
    return (items as OrderFile[]).sort((a, b) => a.orderNum - b.orderNum);
  }
  
  async getNextOrderNum(orderId: string): Promise<number> {
    const files = await this.findByOrder(orderId);
    const maxOrderNum = Math.max(0, ...files.map(f => f.orderNum));
    return maxOrderNum + 1;
  }
  
  async delete(fileId: string, orderId: string): Promise<void> {
    await deleteItem({
      PK: `ORDER#${orderId}`,
      SK: `FILE#${fileId}`,
    });
  }
  
  async updateThumbnail(fileId: string, orderId: string, thumbnail: string): Promise<OrderFile> {
    const updated = await updateItem({
      Key: {
        PK: `ORDER#${orderId}`,
        SK: `FILE#${fileId}`,
      },
      UpdateExpression: 'SET #thumbnail = :thumbnail',
      ExpressionAttributeNames: {
        '#thumbnail': 'thumbnail',
      },
      ExpressionAttributeValues: {
        ':thumbnail': thumbnail,
      },
    });
    
    return updated as OrderFile;
  }
}