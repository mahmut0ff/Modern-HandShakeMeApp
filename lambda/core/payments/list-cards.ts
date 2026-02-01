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

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Check cache first
    const cacheKey = `payment-cards:${userId}`;
    const cachedCards = await cache.get(cacheKey);
    
    if (cachedCards) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedCards)
      };
    }

    // Get user's payment cards
    const paymentCards = await paymentRepository.findUserCards(userId);

    // Format response
    const formattedCards = paymentCards.map(card => ({
      id: card.id,
      last4: card.last4,
      brand: card.brand,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cardholderName: card.cardholderName,
      isDefault: card.isDefault,
      isExpired: new Date() > new Date(card.expiryYear, card.expiryMonth - 1),
      createdAt: card.createdAt
    }));

    // Calculate statistics
    const stats = {
      total: formattedCards.length,
      expired: formattedCards.filter(card => card.isExpired).length,
      expiringThisMonth: formattedCards.filter(card => {
        const now = new Date();
        return card.expiryYear === now.getFullYear() && 
               card.expiryMonth === now.getMonth() + 1;
      }).length,
      brands: formattedCards.reduce((acc, card) => {
        acc[card.brand] = (acc[card.brand] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const response = {
      cards: formattedCards,
      stats
    };

    // Cache the response for 10 minutes
    await cache.set(cacheKey, response, 600);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error listing payment cards:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cards: [], 
        stats: { 
          total: 0, 
          expired: 0, 
          expiringThisMonth: 0, 
          brands: {} 
        } 
      })
    };
  }
};