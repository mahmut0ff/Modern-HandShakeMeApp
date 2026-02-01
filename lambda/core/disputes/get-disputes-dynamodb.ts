// Get disputes list for user

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { DisputeFilters } from '../shared/types/disputes';

const disputesRepository = new DisputesRepository();

async function getDisputesHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20');
    const nextToken = queryParams.nextToken;
    
    // Build filters
    const filters: DisputeFilters = {};
    if (queryParams.status) filters.status = queryParams.status as any;
    if (queryParams.priority) filters.priority = queryParams.priority as any;
    if (queryParams.reason) filters.reason = queryParams.reason as any;
    if (queryParams.dateFrom) filters.dateFrom = queryParams.dateFrom;
    if (queryParams.dateTo) filters.dateTo = queryParams.dateTo;

    // Get disputes for user
    const result = await disputesRepository.findDisputesByUser(
      userId,
      filters,
      limit,
      nextToken
    );

    // Format response for API compatibility
    const formattedDisputes = result.disputes.map(dispute => ({
      id: dispute.id,
      orderId: dispute.orderId,
      projectId: dispute.projectId,
      order: {
        id: dispute.orderId,
        title: dispute.order.title,
      },
      project: dispute.projectId ? {
        id: dispute.projectId,
        title: 'Project Title', // TODO: Get from project service
      } : undefined,
      client: {
        id: dispute.client.id,
        firstName: dispute.client.firstName,
        lastName: dispute.client.lastName,
        avatar: dispute.client.avatar,
        role: 'CLIENT',
      },
      master: {
        id: dispute.master.id,
        firstName: dispute.master.firstName,
        lastName: dispute.master.lastName,
        avatar: dispute.master.avatar,
        role: 'MASTER',
      },
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      resolution: dispute.resolution,
      resolutionType: dispute.resolutionType,
      amountDisputed: dispute.amountDisputed,
      amountResolved: dispute.amountResolved,
      evidenceCount: dispute.evidenceCount,
      messageCount: dispute.messageCount,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      resolvedAt: dispute.resolvedAt,
      closedAt: dispute.closedAt,
    }));

    const response = {
      results: formattedDisputes,
      count: formattedDisputes.length,
      pagination: result.pagination,
      next: result.nextToken,
    };

    logger.info('Disputes retrieved successfully', { 
      userId, 
      count: formattedDisputes.length,
      filters 
    });

    return success(response);

  } catch (error: any) {
    logger.error('Error fetching disputes', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch disputes' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(getDisputesHandler));
