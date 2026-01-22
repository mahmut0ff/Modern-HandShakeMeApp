// Review Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Review {
  id: string;
  projectId: string;
  masterId: string;
  clientId: string;
  rating: number;
  comment: string;
  response?: string;
  respondedAt?: string;
  helpfulCount: number;
  reportCount: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ReviewRepository {
  async create(data: Partial<Review>): Promise<Review> {
    const review: Review = {
      id: uuidv4(),
      projectId: data.projectId!,
      masterId: data.masterId!,
      clientId: data.clientId!,
      rating: data.rating!,
      comment: data.comment!,
      response: data.response,
      respondedAt: data.respondedAt,
      helpfulCount: 0,
      reportCount: 0,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.review(review.masterId, review.id),
      ...review,
    });
    
    return review;
  }
  
  async findById(masterId: string, reviewId: string): Promise<Review | null> {
    const item = await getItem(Keys.review(masterId, reviewId));
    return item as Review | null;
  }
  
  async findByMaster(masterId: string): Promise<Review[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${masterId}`,
        ':sk': 'REVIEW#',
      },
      ScanIndexForward: false,
    });
    
    return items as Review[];
  }
  
  async update(masterId: string, reviewId: string, data: Partial<Review>): Promise<Review> {
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
      Key: Keys.review(masterId, reviewId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Review;
  }
  
  async delete(masterId: string, reviewId: string): Promise<void> {
    await deleteItem(Keys.review(masterId, reviewId));
  }
}
