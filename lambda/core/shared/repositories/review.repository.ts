// Review Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface Review {
  id: string;
  orderId: string;
  clientId: string;
  masterId: string;
  rating: number; // 1-5
  comment: string;
  isAnonymous: boolean;
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  response?: string;
  responseAt?: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'OFFENSIVE' | 'OTHER';
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

export interface ReviewHelpful {
  reviewId: string;
  userId: string;
  createdAt: string;
}

export class ReviewRepository {
  async create(data: Partial<Review>): Promise<Review> {
    const review: Review = {
      id: uuidv4(),
      orderId: data.orderId!,
      clientId: data.clientId!,
      masterId: data.masterId!,
      rating: data.rating!,
      comment: data.comment!,
      isAnonymous: data.isAnonymous ?? false,
      isVerified: data.isVerified ?? false,
      helpfulCount: 0,
      reportCount: 0,
      response: data.response,
      responseAt: data.responseAt,
      tags: data.tags || [],
      images: data.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.review(review.masterId, review.id),
      ...review,
      GSI1PK: `CLIENT#${review.clientId}`,
      GSI1SK: `REVIEW#${review.createdAt}#${review.id}`,
      GSI2PK: `ORDER#${review.orderId}`,
      GSI2SK: 'REVIEW',
      GSI3PK: `RATING#${review.rating}`,
      GSI3SK: `${review.createdAt}#${review.id}`,
    });
    
    return review;
  }
  
  async findById(masterId: string, reviewId: string): Promise<Review | null> {
    const item = await getItem(Keys.review(masterId, reviewId));
    return item as Review | null;
  }
  
  async findByOrder(orderId: string): Promise<Review | null> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`,
        ':sk': 'REVIEW',
      },
    });
    
    return items[0] as Review | null;
  }
  
  async findByMaster(masterId: string, options: {
    rating?: number;
    isVerified?: boolean;
    limit?: number;
    lastEvaluatedKey?: Record<string, any>;
  } = {}): Promise<{ items: Review[]; lastEvaluatedKey?: Record<string, any> }> {
    const { rating, isVerified, limit = 50, lastEvaluatedKey } = options;
    
    let result: any;
    
    if (rating) {
      result = await queryItems({
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `RATING#${rating}`,
        },
        ScanIndexForward: false,
        Limit: limit * 2, // Get more to filter by masterId
        ExclusiveStartKey: lastEvaluatedKey,
      });
      
      // Filter by masterId
      const allItems = Array.isArray(result) ? result : (result.Items || []);
      const filteredItems = allItems.filter((item: any) => item.masterId === masterId).slice(0, limit);
      
      return {
        items: filteredItems as Review[],
        lastEvaluatedKey: Array.isArray(result) ? undefined : result.LastEvaluatedKey,
      };
    } else {
      result = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${masterId}`,
          ':sk': 'REVIEW#',
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      });
    }
    
    const items = Array.isArray(result) ? result : (result.Items || []);
    
    // Filter by verification status if specified
    let filteredItems = items;
    if (isVerified !== undefined) {
      filteredItems = items.filter((item: any) => item.isVerified === isVerified);
    }
    
    return {
      items: filteredItems as Review[],
      lastEvaluatedKey: Array.isArray(result) ? undefined : result.LastEvaluatedKey,
    };
  }
  
  async findByClient(clientId: string, options: {
    limit?: number;
    lastEvaluatedKey?: Record<string, any>;
  } = {}): Promise<{ items: Review[]; lastEvaluatedKey?: Record<string, any> }> {
    const { limit = 50, lastEvaluatedKey } = options;
    
    const result: any = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CLIENT#${clientId}`,
        ':sk': 'REVIEW#',
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    });
    
    const items = Array.isArray(result) ? result : (result.Items || []);
    
    return {
      items: items as Review[],
      lastEvaluatedKey: Array.isArray(result) ? undefined : result.LastEvaluatedKey,
    };
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
  
  async addResponse(masterId: string, reviewId: string, response: string): Promise<Review> {
    return this.update(masterId, reviewId, {
      response,
      responseAt: new Date().toISOString(),
    });
  }
  
  async markHelpful(reviewId: string, userId: string): Promise<void> {
    // Add to helpful tracking
    await putItem({
      PK: `REVIEW#${reviewId}`,
      SK: `HELPFUL#${userId}`,
      reviewId,
      userId,
      createdAt: new Date().toISOString(),
    });
  }
  
  async unmarkHelpful(reviewId: string, userId: string): Promise<void> {
    await deleteItem({
      PK: `REVIEW#${reviewId}`,
      SK: `HELPFUL#${userId}`,
    });
  }
  
  async isMarkedHelpful(reviewId: string, userId: string): Promise<boolean> {
    const item = await getItem({
      PK: `REVIEW#${reviewId}`,
      SK: `HELPFUL#${userId}`,
    });
    
    return !!item;
  }
  
  async incrementHelpfulCount(masterId: string, reviewId: string): Promise<Review> {
    const review = await this.findById(masterId, reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    return this.update(masterId, reviewId, {
      helpfulCount: review.helpfulCount + 1,
    });
  }
  
  async decrementHelpfulCount(masterId: string, reviewId: string): Promise<Review> {
    const review = await this.findById(masterId, reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    return this.update(masterId, reviewId, {
      helpfulCount: Math.max(0, review.helpfulCount - 1),
    });
  }
  
  async reportReview(reviewId: string, reporterId: string, reason: ReviewReport['reason'], description?: string): Promise<ReviewReport> {
    const report: ReviewReport = {
      id: uuidv4(),
      reviewId,
      reporterId,
      reason,
      description,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `REVIEW#${reviewId}`,
      SK: `REPORT#${report.id}`,
      ...report,
      GSI1PK: `REPORTER#${reporterId}`,
      GSI1SK: `REPORT#${report.createdAt}#${report.id}`,
    });
    
    return report;
  }
  
  async getReviewStats(masterId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    verifiedReviews: number;
    needsResponse: number;
  }> {
    // Get all reviews for accurate stats (no pagination)
    const result = await this.findByMaster(masterId, { limit: 1000 });
    const reviews = result.items;
    
    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(r => r.isVerified).length;
    const needsResponse = reviews.filter(r => !r.response).length;
    
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;
    
    const ratingDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedReviews,
      needsResponse,
    };
  }
  
  async getReviewsNeedingResponse(masterId: string): Promise<Review[]> {
    const result = await this.findByMaster(masterId, { limit: 100 });
    return result.items.filter(review => !review.response);
  }
  
  async getReportsByReporter(reporterId: string): Promise<ReviewReport[]> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `REPORTER#${reporterId}`,
        ':sk': 'REPORT#',
      },
    });
    
    return items as ReviewReport[];
  }
}