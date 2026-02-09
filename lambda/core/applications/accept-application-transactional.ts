// Accept application - Transactional implementation
// Ensures atomic execution of all operations: accept response, decline others, create order, create chat

import type { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { transactWrite, getItem, queryItems, TABLE_NAME } from '../shared/db/dynamodb-client';
import { Keys } from '../shared/db/dynamodb-keys';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { NotificationService } from '../shared/services/notification';
import { success, forbidden, notFound, badRequest, conflict } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';
import { Application, Order } from '../shared/types';

interface AcceptApplicationResponse {
  orderId: string;
  chatRoomId: string;
  workStatus: string;
  acceptedApplicationId: string;
  message: string;
}

async function acceptApplicationTransactionalHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const applicationId = event.pathParameters?.id;
  const orderId = event.pathParameters?.orderId || event.queryStringParameters?.orderId;
  
  if (!applicationId) {
    return badRequest('Application ID is required');
  }
  
  if (!orderId) {
    return badRequest('Order ID is required');
  }
  
  if (event.auth.role !== 'CLIENT') {
    return forbidden('Only clients can accept applications');
  }
  
  logger.info('Accept application transactional request', { userId, applicationId, orderId });
  
  try {
    // Step 1: Validate permissions and state
    const [order, application] = await Promise.all([
      getItem(Keys.order(orderId)),
      getItem(Keys.application(orderId, applicationId))
    ]);
    
    if (!order) {
      return notFound('Order not found');
    }
    
    if (!application) {
      return notFound('Application not found');
    }
    
    // Verify ownership
    if (order.clientId !== userId) {
      return forbidden('You can only accept applications for your own orders');
    }
    
    // Verify order is in acceptable state
    if (order.status !== 'ACTIVE') {
      return badRequest(`Cannot accept application. Order status is ${order.status}. Only ACTIVE orders can accept applications.`);
    }
    
    // Verify application is in acceptable state
    if (application.status !== 'PENDING') {
      return badRequest(`Application is not pending. Current status: ${application.status}`);
    }
    
    // Check if order already has an accepted application (idempotency check)
    if (order.acceptedApplicationId) {
      if (order.acceptedApplicationId === applicationId) {
        // Same application already accepted - return existing data
        logger.info('Application already accepted (idempotent)', { 
          userId, 
          applicationId, 
          orderId,
          existingAcceptedId: order.acceptedApplicationId 
        });
        
        // Find existing chat room
        const existingRooms = await queryItems({
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'ROOM#',
          },
        });
        
        const chatRoom = existingRooms.find((room: any) => 
          room.orderId === orderId && 
          room.participants?.includes(application.masterId)
        );
        
        return success({
          orderId: order.id,
          chatRoomId: chatRoom?.roomId || 'unknown',
          workStatus: order.status,
          acceptedApplicationId: applicationId,
          message: 'Application already accepted',
        } as AcceptApplicationResponse);
      } else {
        // Different application already accepted
        return conflict(`Another application has already been accepted for this order`);
      }
    }
    
    // Step 2: Get all other pending applications for rejection
    const allApplications = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ORDER#${orderId}`,
        ':sk': 'APP#',
      },
    });
    
    const otherPendingApplications = allApplications.filter(
      (app: any) => app.id !== applicationId && app.status === 'PENDING'
    );
    
    // Step 3: Prepare transaction items
    const now = new Date().toISOString();
    const chatRoomId = uuidv4();
    const transactionItems: any[] = [];
    
    // 3.1: Accept selected application
    transactionItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: Keys.application(orderId, applicationId),
        UpdateExpression: 'SET #status = :accepted, #updatedAt = :now',
        ConditionExpression: '#status = :pending', // Prevent race condition
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':accepted': 'ACCEPTED',
          ':pending': 'PENDING',
          ':now': now,
        },
      },
    });
    
    // 3.2: Reject all other pending applications
    otherPendingApplications.forEach((app: any) => {
      transactionItems.push({
        Update: {
          TableName: TABLE_NAME,
          Key: Keys.application(orderId, app.id),
          UpdateExpression: 'SET #status = :rejected, #updatedAt = :now, #rejectionReason = :reason',
          ConditionExpression: '#status = :pending', // Only reject if still pending
          ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
            '#rejectionReason': 'rejectionReason',
          },
          ExpressionAttributeValues: {
            ':rejected': 'REJECTED',
            ':pending': 'PENDING',
            ':now': now,
            ':reason': 'Another contractor was chosen',
          },
        },
      });
    });
    
    // 3.3: Update order - assign master and change status
    transactionItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: Keys.order(orderId),
        UpdateExpression: 'SET #status = :inProgress, #masterId = :masterId, #acceptedApplicationId = :appId, #updatedAt = :now, GSI2PK = :gsi2pk',
        ConditionExpression: '#status = :active AND attribute_not_exists(#acceptedApplicationId)', // Prevent concurrent accepts
        ExpressionAttributeNames: {
          '#status': 'status',
          '#masterId': 'masterId',
          '#acceptedApplicationId': 'acceptedApplicationId',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':inProgress': 'IN_PROGRESS',
          ':active': 'ACTIVE',
          ':masterId': application.masterId,
          ':appId': applicationId,
          ':now': now,
          ':gsi2pk': `STATUS#IN_PROGRESS`,
        },
      },
    });
    
    // 3.4: Create chat room
    const chatRoom = {
      id: chatRoomId,
      orderId: orderId,
      participants: [userId, application.masterId],
      lastMessageAt: now,
      unreadCount: {},
      createdAt: now,
    };
    
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          ...Keys.chatRoom(chatRoomId),
          ...chatRoom,
        },
        ConditionExpression: 'attribute_not_exists(PK)', // Ensure no duplicate
      },
    });
    
    // 3.5: Create chat participant records
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ROOM#${chatRoomId}`,
          GSI1PK: `ROOM#${chatRoomId}`,
          GSI1SK: `USER#${userId}`,
          roomId: chatRoomId,
          userId: userId,
          joinedAt: now,
          unreadCount: 0,
          isActive: true,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });
    
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${application.masterId}`,
          SK: `ROOM#${chatRoomId}`,
          GSI1PK: `ROOM#${chatRoomId}`,
          GSI1SK: `USER#${application.masterId}`,
          roomId: chatRoomId,
          userId: application.masterId,
          joinedAt: now,
          unreadCount: 0,
          isActive: true,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });
    
    // 3.6: Create system message in chat
    const systemMessageId = uuidv4();
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          ...Keys.message(chatRoomId, systemMessageId),
          id: systemMessageId,
          roomId: chatRoomId,
          senderId: 'SYSTEM',
          type: 'SYSTEM',
          content: 'Order created. Contractor assigned.',
          isEdited: false,
          isRead: false,
          readBy: {},
          createdAt: now,
        },
      },
    });
    
    // Step 4: Execute transaction
    logger.info('Executing accept application transaction', {
      userId,
      orderId,
      applicationId,
      chatRoomId,
      transactionItemCount: transactionItems.length,
      otherApplicationsToReject: otherPendingApplications.length,
    });
    
    await transactWrite(transactionItems);
    
    logger.info('Accept application transaction completed successfully', {
      userId,
      orderId,
      applicationId,
      chatRoomId,
    });
    
    // Step 5: Send notifications (async, non-blocking)
    // Notifications are sent after transaction to avoid blocking
    setImmediate(async () => {
      try {
        const notificationService = new NotificationService();
        const orderRepo = new OrderRepository();
        
        const updatedOrder = await orderRepo.findById(orderId);
        
        // Notify accepted master
        await notificationService.notifyApplicationAccepted(application.masterId, {
          applicationId,
          orderId,
          orderTitle: updatedOrder?.title || order.title,
          clientName: userId, // Will be enriched by notification service
        });
        
        // Notify rejected masters
        if (otherPendingApplications.length > 0) {
          const rejectedMasterIds = otherPendingApplications.map((app: any) => app.masterId);
          await notificationService.notifyMultipleApplicationsRejected(rejectedMasterIds, {
            applicationId: '',
            orderId,
            orderTitle: updatedOrder?.title || order.title,
          });
        }
        
        logger.info('Notifications sent successfully', {
          acceptedMaster: application.masterId,
          rejectedMasters: otherPendingApplications.length,
        });
      } catch (error) {
        logger.error('Failed to send notifications', error, {
          orderId,
          applicationId,
        });
        // Don't throw - notifications are best-effort
      }
    });
    
    // Step 6: Return success response
    return success({
      orderId: orderId,
      chatRoomId: chatRoomId,
      workStatus: 'IN_PROGRESS',
      acceptedApplicationId: applicationId,
      message: 'Application accepted successfully',
    } as AcceptApplicationResponse, 200);
    
  } catch (error: any) {
    // Handle specific DynamoDB errors
    if (error.name === 'TransactionCanceledException') {
      const reasons = error.CancellationReasons || [];
      logger.error('Transaction cancelled', error, { 
        userId, 
        orderId, 
        applicationId,
        reasons 
      });
      
      // Check for conditional check failures
      const hasConditionalCheckFailure = reasons.some(
        (r: any) => r.Code === 'ConditionalCheckFailed'
      );
      
      if (hasConditionalCheckFailure) {
        return conflict('Application has already been processed or order state has changed. Please refresh and try again.');
      }
      
      return badRequest('Transaction failed. Please try again.');
    }
    
    logger.error('Accept application failed', error, { userId, orderId, applicationId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withAuth(acceptApplicationTransactionalHandler, { roles: ['CLIENT'] })
);
