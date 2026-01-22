import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';

const cache = new CacheService();

async function listCardsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;

    // Check cache first
    const cacheKey = `payment-cards:${user.userId}`;
    const cachedCards = await cache.get(cacheKey);
    
    if (cachedCards) {
      return success(cachedCards);
    }

    // Get user's payment cards
    const paymentCards = await prisma.paymentCard.findMany({
      where: {
        userId: user.userId,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

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

    return success(response);

  } catch (error) {
    console.error('Error listing payment cards:', error);

    return success({ cards: [], stats: { total: 0, expired: 0, expiringThisMonth: 0, brands: {} } });
  }
}

export const handler = withRequestTransform(withAuth(listCardsHandler));
