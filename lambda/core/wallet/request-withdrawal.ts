import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { success, badRequest, forbidden } from '@/shared/utils/response';
import { validate } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const notificationService = new NotificationService();

// Validation schema
const withdrawalRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(100000, 'Maximum withdrawal amount is 100,000 KGS'),
  paymentMethod: z.enum(['bank_card', 'bank_transfer', 'mobile_wallet']),
  paymentDetails: z.object({
    cardNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
    phoneNumber: z.string().optional()
  }),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(withdrawalRequestSchema)(body);

    // Validate payment details based on method
    switch (validatedData.paymentMethod) {
      case 'bank_card':
        if (!validatedData.paymentDetails.cardNumber) {
          return createErrorResponse(400, 'VALIDATION_ERROR', 'Card number is required for bank card withdrawals');
        }
        break;
      case 'bank_transfer':
        if (!validatedData.paymentDetails.bankName || !validatedData.paymentDetails.accountNumber) {
          return createErrorResponse(400, 'VALIDATION_ERROR', 'Bank name and account number are required for bank transfers');
        }
        break;
      case 'mobile_wallet':
        if (!validatedData.paymentDetails.phoneNumber) {
          return createErrorResponse(400, 'VALIDATION_ERROR', 'Phone number is required for mobile wallet withdrawals');
        }
        break;
    }

    // Get current wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId }
    });

    if (!wallet) {
      return createErrorResponse(404, 'NOT_FOUND', 'Wallet not found');
    }

    // Check minimum withdrawal amount
    const minWithdrawal = 100; // 100 KGS minimum
    if (validatedData.amount < minWithdrawal) {
      return createErrorResponse(400, 'VALIDATION_ERROR', `Minimum withdrawal amount is ${minWithdrawal} KGS`);
    }

    // Calculate withdrawal fee
    const feePercentage = 0.02; // 2% fee
    const minFee = 10; // 10 KGS minimum fee
    const maxFee = 500; // 500 KGS maximum fee
    
    let fee = Math.max(minFee, Math.min(maxFee, validatedData.amount * feePercentage));
    fee = Math.round(fee * 100) / 100;

    const totalDeduction = validatedData.amount + fee;

    // Check if user has sufficient balance
    const availableBalance = Number(wallet.balance) - Number(wallet.reserved);
    
    // Check for pending withdrawals
    const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: user.userId,
        status: { in: ['PENDING', 'APPROVED'] }
      },
      _sum: {
        amount: true,
        fee: true
      }
    });

    const pendingAmount = Number(pendingWithdrawals._sum.amount || 0) + Number(pendingWithdrawals._sum.fee || 0);
    const effectiveBalance = availableBalance - pendingAmount;

    if (effectiveBalance < totalDeduction) {
      return createErrorResponse(400, 'INSUFFICIENT_FUNDS', 
        `Insufficient balance. Available: ${effectiveBalance} KGS, Required: ${totalDeduction} KGS (including ${fee} KGS fee)`);
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: user.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: { not: 'REJECTED' }
      },
      _sum: {
        amount: true
      }
    });

    const dailyLimit = 50000; // 50,000 KGS daily limit
    const todayTotal = Number(todayWithdrawals._sum.amount || 0) + validatedData.amount;

    if (todayTotal > dailyLimit) {
      return createErrorResponse(400, 'LIMIT_EXCEEDED', 
        `Daily withdrawal limit exceeded. Limit: ${dailyLimit} KGS, Today's total: ${todayTotal} KGS`);
    }

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.userId,
        amount: validatedData.amount,
        fee: fee,
        paymentMethod: validatedData.paymentMethod,
        paymentDetails: validatedData.paymentDetails,
        status: 'PENDING'
      }
    });

    // Update wallet reserved amount
    await prisma.wallet.update({
      where: { userId: user.userId },
      data: {
        reserved: {
          increment: totalDeduction
        }
      }
    });

    // Send notification to user
    await notificationService.sendNotification({
      userId: user.userId,
      type: 'WITHDRAWAL_REQUESTED',
      title: 'Заявка на вывод средств',
      message: `Ваша заявка на вывод ${validatedData.amount} KGS принята к рассмотрению`,
      data: {
        withdrawalId: withdrawalRequest.id,
        amount: validatedData.amount,
        fee: fee,
        paymentMethod: validatedData.paymentMethod
      }
    });

    // Notify admin about new withdrawal request
    await notificationService.sendAdminNotification({
      type: 'WITHDRAWAL_REQUESTED',
      title: 'Новая заявка на вывод средств',
      message: `Пользователь ${user.email} запросил вывод ${validatedData.amount} KGS`,
      data: {
        withdrawalId: withdrawalRequest.id,
        userId: user.userId,
        amount: validatedData.amount,
        fee: fee,
        paymentMethod: validatedData.paymentMethod
      }
    });

    // Invalidate cache
    await cache.invalidatePattern(`wallet-balance:${user.userId}*`);
    await cache.invalidatePattern(`transactions:${user.userId}*`);

    console.log(`Withdrawal requested: ${withdrawalRequest.id} for user ${user.userId}, amount: ${validatedData.amount}`);

    return createResponse(201, {
      withdrawalId: withdrawalRequest.id,
      amount: validatedData.amount,
      fee: fee,
      totalDeduction: totalDeduction,
      paymentMethod: validatedData.paymentMethod,
      status: 'PENDING',
      estimatedProcessingTime: '1-3 business days',
      createdAt: withdrawalRequest.createdAt.toISOString(),
      message: 'Withdrawal request submitted successfully'
    });

  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to request withdrawal');
  } finally {
    await prisma.$disconnect();
  }
};