import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, badRequest } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';

const cache = new CacheService();

async function setDefaultCardHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;

    const cardId = event.pathParameters?.id;
    if (!cardId) {
      return badRequest('Card ID is required');
    }

    // Check if card exists and belongs to the user
    const paymentCard = await prisma.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: user.userId,
        isActive: true
      }
    });

    if (!paymentCard) {
      return notFound('Payment card not found or access denied');
    }

    // Check if card is already default
    if (paymentCard.isDefault) {
      return success({
        message: 'Card is already the default payment method',
        cardId: cardId
      });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Unset current default card
      await tx.paymentCard.updateMany({
        where: {
          userId: user.userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });

      // Set new default card
      await tx.paymentCard.update({
        where: { id: cardId },
        data: { isDefault: true }
      });
    });

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${user.userId}*`);

    console.log(`Default payment card set: ${cardId} for user ${user.userId}`);

    return success({
      message: 'Default payment card updated successfully',
      cardId: cardId,
      last4: paymentCard.last4,
      brand: paymentCard.brand
    });

  } catch (error) {
    console.error('Error setting default payment card:', error);

    return badRequest('Failed to set default payment card');
  }
}

export const handler = withRequestTransform(withAuth(setDefaultCardHandler));
