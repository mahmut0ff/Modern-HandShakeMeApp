import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { PaymentRepository } from '../shared/repositories/payment.repository';
import { UserService } from '../shared/services/user.service';
import { StripeService } from '../shared/services/stripe.service';
import { CacheService } from '../shared/services/cache';
import { verifyToken } from '../shared/services/token';

const paymentRepository = new PaymentRepository();
const userService = new UserService();
const stripeService = new StripeService();
const cache = new CacheService();

// Validation schema
const addCardSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  setAsDefault: z.boolean().default(false)
});

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

    const body = JSON.parse(event.body || '{}');
    const validatedData = addCardSchema.parse(body);

    // Get user information
    const user = await userService.findUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        user.email || `user-${userId}@handshakeme.app`,
        userId
      );
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await userService.setStripeCustomerId(userId, stripeCustomerId);
    }

    // Retrieve payment method from Stripe
    const paymentMethod = await stripeService.retrievePaymentMethod(validatedData.paymentMethodId);
    
    if (!paymentMethod.card) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid payment method - not a card' })
      };
    }

    // Attach payment method to customer
    await stripeService.attachPaymentMethod(validatedData.paymentMethodId, stripeCustomerId);

    // Check if user already has this card
    const existingCard = await paymentRepository.findCardByStripeId(
      validatedData.paymentMethodId, 
      userId
    );

    if (existingCard) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Card already exists' })
      };
    }

    // If this should be the default card, or if this is the user's first card
    const existingCardsCount = await paymentRepository.countUserCards(userId);
    const shouldBeDefault = validatedData.setAsDefault || existingCardsCount === 0;

    // If this should be the default card, unset other default cards
    if (shouldBeDefault && existingCardsCount > 0) {
      await paymentRepository.setDefaultCard('', userId); // This will unset all defaults
    }

    // Create payment card record
    const paymentCard = await paymentRepository.createCard({
      userId,
      stripeCardId: validatedData.paymentMethodId,
      last4: paymentMethod.card.last4,
      brand: paymentMethod.card.brand,
      expiryMonth: paymentMethod.card.exp_month,
      expiryYear: paymentMethod.card.exp_year,
      cardholderName: paymentMethod.billing_details?.name || undefined,
      isDefault: shouldBeDefault,
    });

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${userId}*`);

    console.log(`Payment card added: ${paymentCard.id} for user ${userId}`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: paymentCard.id,
        last4: paymentCard.last4,
        brand: paymentCard.brand,
        expiryMonth: paymentCard.expiryMonth,
        expiryYear: paymentCard.expiryYear,
        cardholderName: paymentCard.cardholderName,
        isDefault: paymentCard.isDefault,
        createdAt: paymentCard.createdAt
      })
    };

  } catch (error) {
    console.error('Error adding payment card:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation error',
          details: error.errors 
        })
      };
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    // Handle Stripe errors
    const stripeErrorMessage = stripeService.getErrorMessage(error);
    if (stripeErrorMessage !== 'An unexpected payment error occurred.') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: stripeErrorMessage })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to add payment card' })
    };
  }
};