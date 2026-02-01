import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PaymentRepository } from '../shared/repositories/payment.repository';
import { WalletRepository } from '../shared/repositories/wallet.repository';
import { StripeService } from '../shared/services/stripe.service';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const paymentRepository = new PaymentRepository();
const walletRepository = new WalletRepository();
const stripeService = new StripeService();
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

    // Check if this is the only card and there are pending transactions
    const activeCardsCount = await paymentRepository.countUserCards(userId);
    if (activeCardsCount === 1) {
      // Check for pending transactions that might need this card
      const pendingTransactions = await walletRepository.countPendingTransactions(userId);
      if (pendingTransactions > 0) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Cannot delete the only payment card while there are pending transactions' 
          })
        };
      }
    }

    // Detach payment method from Stripe customer
    try {
      await stripeService.detachPaymentMethod(paymentCard.stripeCardId);
    } catch (stripeError) {
      console.error('Error detaching payment method from Stripe:', stripeError);
      // Continue with deletion even if Stripe detach fails
    }

    // If this was the default card, set another card as default
    if (paymentCard.isDefault && activeCardsCount > 1) {
      const userCards = await paymentRepository.findUserCards(userId);
      const nextCard = userCards.find(card => card.id !== cardId && card.isActive);
      
      if (nextCard) {
        await paymentRepository.setDefaultCard(nextCard.id, userId);
      }
    }

    // Soft delete the card
    await paymentRepository.deleteCard(cardId, userId);

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${userId}*`);

    console.log(`Payment card deleted: ${cardId} for user ${userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Payment card deleted successfully',
        cardId: cardId
      })
    };

  } catch (error) {
    console.error('Error deleting payment card:', error);

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
      body: JSON.stringify({ error: 'Failed to delete payment card' })
    };
  }
};