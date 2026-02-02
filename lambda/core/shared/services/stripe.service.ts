// Stripe Service for payment processing

import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;
  
  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey);
  }
  
  async createCustomer(email: string, userId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
  }
  
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
  }
  
  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.retrieve(paymentMethodId);
  }
  
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }
  
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }
  
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    paymentMethodId?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: metadata || {},
    };
    
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
      params.confirmation_method = 'manual';
      params.confirm = true;
    }
    
    return await this.stripe.paymentIntents.create(params);
  }
  
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }
  
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.cancel(paymentIntentId);
  }
  
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    
    if (amount) {
      params.amount = Math.round(amount * 100); // Convert to cents
    }
    
    if (reason) {
      params.reason = reason;
    }
    
    return await this.stripe.refunds.create(params);
  }
  
  async listCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    return paymentMethods.data;
  }
  
  isCardError(error: any): error is Stripe.errors.StripeCardError {
    return error.type === 'StripeCardError';
  }
  
  isInvalidRequestError(error: any): error is Stripe.errors.StripeInvalidRequestError {
    return error.type === 'StripeInvalidRequestError';
  }
  
  isAuthenticationError(error: any): error is Stripe.errors.StripeAuthenticationError {
    return error.type === 'StripeAuthenticationError';
  }
  
  isPermissionError(error: any): error is Stripe.errors.StripePermissionError {
    return error.type === 'StripePermissionError';
  }
  
  isRateLimitError(error: any): error is Stripe.errors.StripeRateLimitError {
    return error.type === 'StripeRateLimitError';
  }
  
  isConnectionError(error: any): error is Stripe.errors.StripeConnectionError {
    return error.type === 'StripeConnectionError';
  }
  
  isAPIError(error: any): error is Stripe.errors.StripeAPIError {
    return error.type === 'StripeAPIError';
  }
  
  getErrorMessage(error: any): string {
    if (this.isCardError(error)) {
      return error.message || 'Your card was declined.';
    }
    
    if (this.isInvalidRequestError(error)) {
      return 'Invalid payment information provided.';
    }
    
    if (this.isAuthenticationError(error)) {
      return 'Payment authentication failed.';
    }
    
    if (this.isPermissionError(error)) {
      return 'Payment processing is not available.';
    }
    
    if (this.isRateLimitError(error)) {
      return 'Too many payment requests. Please try again later.';
    }
    
    if (this.isConnectionError(error)) {
      return 'Payment service is temporarily unavailable.';
    }
    
    if (this.isAPIError(error)) {
      return 'Payment processing error occurred.';
    }
    
    return 'An unexpected payment error occurred.';
  }
}