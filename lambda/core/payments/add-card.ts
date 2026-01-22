import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, conflict } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { CacheService } from '../shared/services/cache';
import Stripe from 'stripe';

const cache = new CacheService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const addCardSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  setAsDefault: z.boolean().default(false)
});

async function addCardHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;

    const body = JSON.parse(event.body || '{}');
    const validatedData = addCardSchema.parse(body);

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.userId
        }
      });
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.userId },
        data: { stripeCustomerId }
      });
    }

    // Retrieve payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(validatedData.paymentMethodId);
    
    if (!paymentMethod.card) {
      return badRequest('Invalid payment method - not a card');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(validatedData.paymentMethodId, {
      customer: stripeCustomerId
    });

    // Check if user already has this card
    const existingCard = await prisma.paymentCard.findFirst({
      where: {
        userId: user.userId,
        stripeCardId: validatedData.paymentMethodId
      }
    });

    if (existingCard) {
      return conflict('Card already exists');
    }

    // If this should be the default card, unset other default cards
    if (validatedData.setAsDefault) {
      await prisma.paymentCard.updateMany({
        where: {
          userId: user.userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Check if this is the user's first card (make it default automatically)
    const existingCardsCount = await prisma.paymentCard.count({
      where: {
        userId: user.userId,
        isActive: true
      }
    });

    const shouldBeDefault = validatedData.setAsDefault || existingCardsCount === 0;

    // Create payment card record
    const paymentCard = await prisma.paymentCard.create({
      data: {
        userId: user.userId,
        stripeCardId: validatedData.paymentMethodId,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        cardholderName: paymentMethod.billing_details?.name || null,
        isDefault: shouldBeDefault,
        isActive: true
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`payment-cards:${user.userId}*`);

    console.log(`Payment card added: ${paymentCard.id} for user ${user.userId}`);

    return success({
      id: paymentCard.id,
      last4: paymentCard.last4,
      brand: paymentCard.brand,
      expiryMonth: paymentCard.expiryMonth,
      expiryYear: paymentCard.expiryYear,
      cardholderName: paymentCard.cardholderName,
      isDefault: paymentCard.isDefault,
      createdAt: paymentCard.createdAt
    }, { statusCode: 201 });

  } catch (error) {
    console.error('Error adding payment card:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }

    if ((error as any).type === 'StripeCardError') {
      return badRequest((error as any).message);
    }

    if ((error as any).type === 'StripeInvalidRequestError') {
      return badRequest('Invalid payment method');
    }

    return badRequest('Failed to add payment card');
  }
}

export const handler = withRequestTransform(withAuth(addCardHandler));
