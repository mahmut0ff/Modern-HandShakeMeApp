import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PaymentRepository } from '../shared/repositories/payment.repository';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const paymentRepository = new PaymentRepository();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const cardId = event.pathParameters?.id;
    if (!cardId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Card ID is required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Check if card exists and belongs to the user
    const paymentCard = await paymentRepository.findCardById(cardId, userId);
    if (!paymentCard || !paymentCard.isActive) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment card not found or access denied' })
      };
    }

    // Check if card is already default
    if (paymentCard.isDefault) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Card is already the default payment method',
          cardId: cardId
        })
      };
    }

    // Set new default card (this will unset other defaults automatically)
    await paymentRepository.setDefaultCard(cardId, userId);

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${userId}*`);

    console.log(`Default payment card set: ${cardId} for user ${userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Default payment card updated successfully',
        cardId: cardId,
        last4: paymentCard.last4,
        brand: paymentCard.brand
      })
    };

  } catch (error) {
    console.error('Error setting default payment card:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to set default payment card' })
    };
  }
};