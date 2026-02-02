// @ts-nocheck
// Send message in dispute

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { SendDisputeMessageRequest } from '../shared/types/disputes';

const disputesRepository = new DisputesRepository();

// Validation schema
const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  messageType: z.enum(['TEXT', 'SYSTEM', 'NOTIFICATION']).default('TEXT'),
  isInternal: z.boolean().default(false)
});

async function sendDisputeMessageHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  const userRole = (event.requestContext as any).authorizer?.role;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const disputeId = event.pathParameters?.id;
  if (!disputeId) {
    return badRequest('Dispute ID is required');
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = validate(sendMessageSchema, body);

    // Get dispute to verify access
    const dispute = await disputesRepository.findDisputeById(disputeId);
    if (!dispute) {
      return notFound('Dispute not found');
    }

    // Verify user has access
    const isInvolved =
      dispute.clientId === userId ||
      dispute.masterId === userId ||
      userRole === 'ADMIN';

    if (!isInvolved) {
      return forbidden('Access denied');
    }

    // Check if dispute is closed
    if (dispute.status === 'CLOSED') {
      return badRequest('Cannot send message to closed dispute');
    }

    // Send message
    const message = await disputesRepository.sendMessage(disputeId, data, userId);

    // TODO: Send notification to other party
    // const otherPartyId = dispute.clientId === userId ? dispute.masterId : dispute.clientId;
    // await notificationService.sendNotification({...});

    logger.info('Dispute message sent successfully', { 
      disputeId, 
      messageId: message.id, 
      senderId: userId 
    });

    return success({
      id: message.id,
      dispute: disputeId,
      sender: {
        id: userId,
        firstName: 'User', // TODO: Get from user service
        lastName: 'Name',
        avatar: undefined,
        role: userRole,
      },
      message: message.message,
      messageType: message.messageType,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
    }, { statusCode: 201 });

  } catch (error: any) {
    logger.error('Error sending dispute message', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send message' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(sendDisputeMessageHandler));
