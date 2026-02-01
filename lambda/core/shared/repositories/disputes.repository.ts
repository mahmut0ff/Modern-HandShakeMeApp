// Disputes Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { 
  Dispute, 
  DisputeEvidence, 
  DisputeMessage, 
  DisputeTimeline,
  DisputeWithDetails,
  DisputeMessageWithSender,
  DisputeTimelineWithUser,
  CreateDisputeRequest,
  UpdateDisputeStatusRequest,
  AddEvidenceRequest,
  SendDisputeMessageRequest,
  DisputeFilters,
  PaginatedDisputesResponse,
  DisputeStatus,
  DisputePriority,
  TimelineAction
} from '../types/disputes';

export class DisputesRepository {
  // Dispute CRUD operations
  async createDispute(data: CreateDisputeRequest & {
    clientId: string;
    masterId: string;
    createdBy: string;
    projectId?: string;
  }): Promise<Dispute> {
    const disputeId = uuidv4();
    const now = new Date().toISOString();
    
    const dispute: Dispute = {
      id: disputeId,
      orderId: data.orderId,
      projectId: data.projectId,
      clientId: data.clientId,
      masterId: data.masterId,
      createdBy: data.createdBy,
      reason: data.reason,
      description: data.description,
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: now,
    };
    
    // Create dispute record
    await putItem({
      ...Keys.dispute(disputeId),
      GSI1PK: `USER#${data.clientId}#DISPUTES`,
      GSI1SK: `DISPUTE#${disputeId}`,
      GSI2PK: `ORDER#${data.orderId}#DISPUTES`,
      GSI2SK: `DISPUTE#${disputeId}`,
      GSI3PK: `STATUS#OPEN#DISPUTES`,
      GSI3SK: `DISPUTE#${disputeId}`,
      ...dispute,
    });
    
    // Add user dispute references
    await putItem({
      PK: `USER#${data.clientId}`,
      SK: `DISPUTE#${disputeId}`,
      disputeId,
      role: 'CLIENT',
      createdAt: now,
    });
    
    await putItem({
      PK: `USER#${data.masterId}`,
      SK: `DISPUTE#${disputeId}`,
      disputeId,
      role: 'MASTER',
      createdAt: now,
    });
    
    // Add evidence if provided
    if (data.evidence && data.evidence.length > 0) {
      for (const evidence of data.evidence) {
        await this.addEvidence(disputeId, {
          evidence: [evidence]
        }, data.createdBy);
      }
    }
    
    // Create initial timeline entry
    await this.addTimelineEntry(disputeId, {
      action: 'DISPUTE_CREATED',
      description: `Dispute created: ${data.reason}`,
      userId: data.createdBy,
    });
    
    return dispute;
  }
  
  async findDisputeById(disputeId: string): Promise<Dispute | null> {
    const item = await getItem(Keys.dispute(disputeId));
    return item as Dispute | null;
  }
  
  async findDisputesByUser(
    userId: string, 
    filters?: DisputeFilters,
    limit = 20,
    nextToken?: string
  ): Promise<PaginatedDisputesResponse> {
    const params: any = {
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}#DISPUTES`,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    };
    
    // Add filters
    const filterExpressions: string[] = [];
    const attributeNames: Record<string, string> = {};
    
    if (filters?.status) {
      filterExpressions.push('#status = :status');
      attributeNames['#status'] = 'status';
      params.ExpressionAttributeValues[':status'] = filters.status;
    }
    
    if (filters?.priority) {
      filterExpressions.push('priority = :priority');
      params.ExpressionAttributeValues[':priority'] = filters.priority;
    }
    
    if (filters?.reason) {
      filterExpressions.push('reason = :reason');
      params.ExpressionAttributeValues[':reason'] = filters.reason;
    }
    
    if (filters?.dateFrom) {
      filterExpressions.push('createdAt >= :dateFrom');
      params.ExpressionAttributeValues[':dateFrom'] = filters.dateFrom;
    }
    
    if (filters?.dateTo) {
      filterExpressions.push('createdAt <= :dateTo');
      params.ExpressionAttributeValues[':dateTo'] = filters.dateTo;
    }
    
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }
    
    if (Object.keys(attributeNames).length > 0) {
      params.ExpressionAttributeNames = attributeNames;
    }
    
    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }
    
    const result = await queryItems(params);
    
    // Convert to DisputeWithDetails (user/order info will be populated by service layer)
    const disputes: DisputeWithDetails[] = result.map((item: any) => ({
      ...item,
      order: { id: item.orderId, title: 'Order Title' }, // Will be populated
      client: { id: item.clientId, firstName: 'Client', lastName: 'Name' }, // Will be populated
      master: { id: item.masterId, firstName: 'Master', lastName: 'Name' }, // Will be populated
      evidenceCount: 0, // Will be calculated
      messageCount: 0, // Will be calculated
    }));
    
    const hasMore = !!result.LastEvaluatedKey;
    const nextTokenValue = hasMore 
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;
    
    return {
      disputes,
      pagination: {
        page: 1, // For compatibility
        limit,
        total: disputes.length,
        hasMore,
      },
      nextToken: nextTokenValue,
    };
  }
  
  async updateDisputeStatus(
    disputeId: string, 
    data: UpdateDisputeStatusRequest,
    updatedBy: string
  ): Promise<Dispute> {
    const now = new Date().toISOString();
    
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    // Build update expression
    updateExpressions.push('#status = :status');
    attributeNames['#status'] = 'status';
    attributeValues[':status'] = data.status;
    
    if (data.resolution) {
      updateExpressions.push('resolution = :resolution');
      attributeValues[':resolution'] = data.resolution;
    }
    
    if (data.resolutionType) {
      updateExpressions.push('resolutionType = :resolutionType');
      attributeValues[':resolutionType'] = data.resolutionType;
    }
    
    if (data.resolutionNotes) {
      updateExpressions.push('resolutionNotes = :resolutionNotes');
      attributeValues[':resolutionNotes'] = data.resolutionNotes;
    }
    
    if (data.amountResolved !== undefined) {
      updateExpressions.push('amountResolved = :amountResolved');
      attributeValues[':amountResolved'] = data.amountResolved;
    }
    
    if (data.status === 'RESOLVED') {
      updateExpressions.push('resolvedAt = :resolvedAt');
      attributeValues[':resolvedAt'] = now;
    }
    
    if (data.status === 'CLOSED') {
      updateExpressions.push('closedAt = :closedAt');
      attributeValues[':closedAt'] = now;
    }
    
    updateExpressions.push('updatedAt = :updatedAt');
    attributeValues[':updatedAt'] = now;
    
    const updated = await updateItem({
      Key: Keys.dispute(disputeId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    // Add timeline entry
    await this.addTimelineEntry(disputeId, {
      action: 'STATUS_CHANGED',
      description: `Status changed to ${data.status}`,
      userId: updatedBy,
      details: { previousStatus: 'UNKNOWN', newStatus: data.status },
    });
    
    return updated as Dispute;
  }
  
  // Evidence operations
  async addEvidence(
    disputeId: string, 
    data: AddEvidenceRequest,
    uploadedBy: string
  ): Promise<DisputeEvidence[]> {
    const now = new Date().toISOString();
    const evidenceRecords: DisputeEvidence[] = [];
    
    for (const evidence of data.evidence) {
      const evidenceId = uuidv4();
      const evidenceRecord: DisputeEvidence = {
        id: evidenceId,
        disputeId,
        type: evidence.type,
        url: evidence.url,
        description: evidence.description,
        uploadedBy,
        uploadedAt: now,
      };
      
      await putItem({
        ...Keys.disputeEvidence(disputeId, evidenceId),
        ...evidenceRecord,
      });
      
      evidenceRecords.push(evidenceRecord);
    }
    
    // Add timeline entry
    await this.addTimelineEntry(disputeId, {
      action: 'EVIDENCE_ADDED',
      description: `Added ${data.evidence.length} evidence item(s)`,
      userId: uploadedBy,
    });
    
    return evidenceRecords;
  }
  
  async findDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
        ':sk': 'EVIDENCE#',
      },
    });
    
    return items as DisputeEvidence[];
  }
  
  // Message operations
  async sendMessage(
    disputeId: string,
    data: SendDisputeMessageRequest,
    senderId: string
  ): Promise<DisputeMessage> {
    const messageId = uuidv4();
    const now = new Date().toISOString();
    const timestamp = Date.now().toString().padStart(13, '0');
    
    const message: DisputeMessage = {
      id: messageId,
      disputeId,
      senderId,
      message: data.message,
      messageType: data.messageType || 'TEXT',
      isInternal: data.isInternal || false,
      createdAt: now,
    };
    
    await putItem({
      ...Keys.disputeMessage(disputeId, timestamp, messageId),
      ...message,
    });
    
    return message;
  }
  
  async findDisputeMessages(
    disputeId: string,
    limit = 50,
    nextToken?: string
  ): Promise<{ messages: DisputeMessageWithSender[]; nextToken?: string }> {
    const params: any = {
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
        ':sk': 'MESSAGE#',
      },
      Limit: limit,
      ScanIndexForward: true, // Oldest first
    };
    
    if (nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }
    
    const result = await queryItems(params);
    
    // Convert to DisputeMessageWithSender (sender info will be populated by service layer)
    const messages: DisputeMessageWithSender[] = result.map((item: any) => ({
      ...item,
      sender: {
        id: item.senderId,
        firstName: 'User',
        lastName: 'Name',
        role: 'USER',
      },
    }));
    
    const nextTokenValue = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined;
    
    return { messages, nextToken: nextTokenValue };
  }
  
  // Timeline operations
  async addTimelineEntry(
    disputeId: string,
    data: {
      action: TimelineAction;
      description: string;
      userId: string;
      details?: Record<string, any>;
    }
  ): Promise<DisputeTimeline> {
    const timelineId = uuidv4();
    const now = new Date().toISOString();
    const timestamp = Date.now().toString().padStart(13, '0');
    
    const timeline: DisputeTimeline = {
      id: timelineId,
      disputeId,
      action: data.action,
      description: data.description,
      userId: data.userId,
      createdAt: now,
      details: data.details,
    };
    
    await putItem({
      ...Keys.disputeTimeline(disputeId, timestamp, timelineId),
      ...timeline,
    });
    
    return timeline;
  }
  
  async findDisputeTimeline(disputeId: string): Promise<DisputeTimelineWithUser[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
        ':sk': 'TIMELINE#',
      },
      ScanIndexForward: true, // Chronological order
    });
    
    // Convert to DisputeTimelineWithUser (user info will be populated by service layer)
    return items.map((item: any) => ({
      ...item,
      user: {
        id: item.userId,
        firstName: 'User',
        lastName: 'Name',
        role: 'USER',
      },
    })) as DisputeTimelineWithUser[];
  }
  
  // Utility methods
  async getDisputeStats(disputeId: string): Promise<{
    evidenceCount: number;
    messageCount: number;
  }> {
    const [evidenceResult, messageResult] = await Promise.all([
      queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `DISPUTE#${disputeId}`,
          ':sk': 'EVIDENCE#',
        },
        Select: 'COUNT',
      }),
      queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `DISPUTE#${disputeId}`,
          ':sk': 'MESSAGE#',
        },
        Select: 'COUNT',
      }),
    ]);
    
    return {
      evidenceCount: evidenceResult.length,
      messageCount: messageResult.length,
    };
  }
  
  async deleteDispute(disputeId: string): Promise<void> {
    // Get all related items
    const allItems = await queryItems({
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `DISPUTE#${disputeId}`,
      },
    });
    
    // Delete all items
    for (const item of allItems) {
      await deleteItem({
        PK: item.PK,
        SK: item.SK,
      });
    }
  }
}