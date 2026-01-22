import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, badRequest, conflict } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';
import Stripe from 'stripe';

const cache = new CacheService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

async function deleteCardHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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

    // Check if this is the only card and there are pending transactions
    const activeCardsCount = await prisma.paymentCard.count({
      where: {
        userId: user.userId,
        isActive: true
      }
    });

    if (activeCardsCount === 1) {
      // Check for pending transactions that might need this card
      const pendingTransactions = await prisma.transaction.count({
        where: {
          userId: user.userId,
          status: 'PENDING'
        }
      });

      if (pendingTransactions > 0) {
        return conflict('Cannot delete the only payment card while there are pending transactions');
      }
    }

    // Detach payment method from Stripe customer
    try {
      await stripe.paymentMethods.detach(paymentCard.stripeCardId);
    } catch (stripeError) {
      console.error('Error detaching payment method from Stripe:', stripeError);
      // Continue with deletion even if Stripe detach fails
    }

    // If this was the default card, set another card as default
    if (paymentCard.isDefault && activeCardsCount > 1) {
      const nextCard = await prisma.paymentCard.findFirst({
        where: {
          userId: user.userId,
          isActive: true,
          id: { not: cardId }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (nextCard) {
        await prisma.paymentCard.update({
          where: { id: nextCard.id },
          data: { isDefault: true }
        });
      }
    }

    // Soft delete the card
    await prisma.paymentCard.update({
      where: { id: cardId },
      data: { 
        isActive: false,
        isDefault: false
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${user.userId}*`);

    console.log(`Payment card deleted: ${cardId} for user ${user.userId}`);

    return success({
      message: 'Payment card deleted successfully',
      cardId: cardId
    });

  } catch (error) {
    console.error('Error deleting payment card:', error);

    return badRequest('Failed to delete payment card');
  }
}

export const handler = withRequestTransform(withAuth(deleteCardHandler));
