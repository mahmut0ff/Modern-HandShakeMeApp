import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { success, notFound } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    // Check cache first
    const cacheKey = `wallet-balance:${user.userId}`;
    const cachedBalance = await cache.get(cacheKey);
    
    if (cachedBalance) {
      return createResponse(200, cachedBalance);
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.userId,
          balance: 0,
          reserved: 0
        }
      });
    }

    // Calculate real-time balance from completed transactions
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        status: 'COMPLETED'
      }
    });

    let calculatedBalance = 0;
    let totalEarnings = 0;
    let totalWithdrawals = 0;
    let totalCommissions = 0;

    completedTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      const commission = Number(transaction.commission);

      switch (transaction.transactionType) {
        case 'PAYMENT':
          calculatedBalance += (amount - commission);
          totalEarnings += amount;
          totalCommissions += commission;
          break;
        case 'WITHDRAWAL':
          calculatedBalance -= amount;
          totalWithdrawals += amount;
          break;
        case 'REFUND':
          calculatedBalance -= amount;
          break;
        case 'COMMISSION':
          calculatedBalance -= amount;
          totalCommissions += amount;
          break;
      }
    });

    // Get reserved amount from pending transactions
    const reservedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        status: 'RESERVED'
      }
    });

    const reservedAmount = reservedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        userId: user.userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

    // Update wallet if balance differs significantly
    const balanceDifference = Math.abs(calculatedBalance - Number(wallet.balance));
    if (balanceDifference > 0.01) {
      wallet = await prisma.wallet.update({
        where: { userId: user.userId },
        data: {
          balance: calculatedBalance,
          reserved: reservedAmount
        }
      });
    }

    // Get recent transactions for activity
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: {
          select: {
            order: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    // Calculate available balance (balance - reserved - pending withdrawals)
    const availableBalance = Math.max(0, calculatedBalance - reservedAmount - pendingWithdrawalAmount);

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEarnings = await prisma.transaction.aggregate({
      where: {
        userId: user.userId,
        transactionType: 'PAYMENT',
        status: 'COMPLETED',
        completedAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true,
        commission: true
      }
    });

    const monthlyEarnings = Number(thisMonthEarnings._sum.amount || 0) - Number(thisMonthEarnings._sum.commission || 0);

    const response = {
      balance: Math.round(calculatedBalance * 100) / 100,
      reserved: Math.round(reservedAmount * 100) / 100,
      available: Math.round(availableBalance * 100) / 100,
      pendingWithdrawals: Math.round(pendingWithdrawalAmount * 100) / 100,
      currency: 'KGS',
      statistics: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
        netEarnings: Math.round((totalEarnings - totalCommissions) * 100) / 100
      },
      recentActivity: recentTransactions.map(t => ({
        id: t.id,
        type: t.transactionType,
        status: t.status,
        amount: Number(t.amount),
        description: t.project?.order?.title || getTransactionDescription(t.transactionType),
        createdAt: t.createdAt.toISOString()
      })),
      pendingWithdrawalRequests: pendingWithdrawals.map(w => ({
        id: w.id,
        amount: Number(w.amount),
        fee: Number(w.fee),
        status: w.status,
        paymentMethod: w.paymentMethod,
        createdAt: w.createdAt.toISOString()
      })),
      lastUpdated: new Date().toISOString()
    };

    // Cache the response for 2 minutes (shorter cache for balance)
    await cache.set(cacheKey, response, 120);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting wallet balance:', error);
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get wallet balance');
  } finally {
    await prisma.$disconnect();
  }
};

function getTransactionDescription(type: string): string {
  switch (type) {
    case 'PAYMENT':
      return 'Оплата за проект';
    case 'WITHDRAWAL':
      return 'Вывод средств';
    case 'REFUND':
      return 'Возврат средств';
    case 'COMMISSION':
      return 'Комиссия';
    case 'RESERVATION':
      return 'Резервирование';
    default:
      return 'Транзакция';
  }
}