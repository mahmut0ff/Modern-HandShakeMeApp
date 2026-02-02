// @ts-nocheck
// Get dispute messages

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const disputesRepository = new DisputesRepository();

async function getDisputeMessagesHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  const userRole = (event.requestContext as any).authorizer?.role;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dispute ID is required' }) };
  }

  try {
    // Get dispute to verify access
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user has access
    if (
      dispute.clientId !== userId &&
      dispute.masterId !== userId &&
      userRole !== 'ADMIN'
    ) {
      return forbidden('Access denied');
    }

    // Get query parameters
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const nextToken = event.queryStringParameters?.nextToken;

    // Get messages
    const result = await disputesRepository.findDisputeMessages(disputeId, limit, nextToken);

    // Format messages for API compatibility
    const formattedMessages = result.messages.map(message => ({
      id: message.id,
      dispute: disputeId,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        avatar: message.sender.avatar,
        role: message.sender.role,
      },
      message: message.message,
      messageType: message.messageType,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
    }));

    const response = {
      results: formattedMessages,
      count: formattedMessages.length,
      next: result.nextToken,
    };

    logger.info('Dispute messages retrieved successfully', { 
      disputeId, 
      userId, 
      count: formattedMessages.length 
    });

    return success(response);

  } catch (error: any) {
    logger.error('Error fetching dispute messages', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch messages' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(getDisputeMessagesHandler));
