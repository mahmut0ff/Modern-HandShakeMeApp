// @ts-nocheck
// Create dispute

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DisputesRepository } from '../shared/repositories/disputes.repository';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden, conflict } from '../shared/utils/response';
import { validate } from '../shared/utils/validation';
import { logger } from '../shared/utils/logger';
import { CreateDisputeRequest, DisputeReason, EvidenceType } from '../shared/types/disputes';

const disputesRepository = new DisputesRepository();

// Validation schema
const createDisputeSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  reason: z.enum([
    'QUALITY_ISSUES',
    'PAYMENT_DISPUTE',
    'COMMUNICATION_PROBLEMS',
    'DEADLINE_MISSED',
    'SCOPE_DISAGREEMENT',
    'CANCELLATION_REQUEST',
    'OTHER'
  ] as const),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description too long'),
  evidence: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO'] as const),
    url: z.string().url('Invalid evidence URL'),
    description: z.string().max(200, 'Evidence description too long').optional()
  })).max(10, 'Maximum 10 evidence items allowed').optional()
});

async function createDisputeHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = (event.requestContext as any).authorizer?.userId;
  const userRole = (event.requestContext as any).authorizer?.role;
  
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const data = validate(createDisputeSchema, body);

    // TODO: Get order details from order service/repository
    // For now, mock the order data
    const order = {
      id: data.orderId,
      title: 'Sample Order',
      clientId: userRole === 'CLIENT' ? userId : 'mock-client-id',
      masterId: userRole === 'MASTER' ? userId : 'mock-master-id',
      status: 'IN_PROGRESS'
    };

    if (!order) {
      return notFound('Order not found');
    }

    // Verify user is involved in the order
    const isClient = order.clientId === userId;
    const isMaster = order.masterId === userId;
    
    if (!isClient && !isMaster) {
      return forbidden('You are not involved in this order');
    }

    // Check if dispute already exists for this order
    // TODO: Implement check in repository
    // const existingDispute = await disputesRepository.findDisputeByOrderId(data.orderId);
    // if (existingDispute) {
    //   return conflict('Dispute already exists for this order');
    // }

    // Check if order is in a state that allows disputes
    const allowedStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(order.status)) {
      return badRequest('Disputes can only be created for accepted, in-progress, completed, or cancelled orders');
    }

    // Create the dispute
    const dispute = await disputesRepository.createDispute({
      orderId: data.orderId,
      clientId: order.clientId,
      masterId: order.masterId,
      createdBy: userId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
    });

    // TODO: Send notifications to other party and admin
    // await notificationService.sendNotification({...});

    logger.info('Dispute created successfully', { 
      disputeId: dispute.id, 
      orderId: data.orderId, 
      createdBy: userId 
    });

    return success({
      id: dispute.id,
      orderId: dispute.orderId,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      createdBy: dispute.createdBy,
      createdAt: dispute.createdAt,
      evidence: data.evidence || [],
    }, { statusCode: 201 });

  } catch (error: any) {
    logger.error('Error creating dispute', error);
    
    if (error.name === 'ZodError') {
      return badRequest(error.errors[0].message);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create dispute' }),
    };
  }
}

export const handler = withErrorHandler(withAuth(createDisputeHandler));