import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth } from '../shared/middleware/auth';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { getPrismaClient } from '../shared/utils/prisma';
import { logger } from '../shared/utils/logger';

const reserveFundsSchema = z.object({
  projectId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

function calculateCommission(amount: number): number {
  if (amount < 1000) {
    return amount * 0.05; // 5%
  } else if (amount <= 5000) {
    return amount * 0.10; // 10%
  } else {
    return amount * 0.15; // 15%
  }
}

async function reserveFundsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prisma = getPrismaClient();
  
  try {
    const user = (event as any).user;
    const userId = user.userId;
    
    if (user.role !== 'CLIENT') {
      return forbidden('Only clients can reserve funds');
    }
    
    logger.info('Reserve funds request', { userId });
    
    const body = JSON.parse(event.body || '{}');
    const data = reserveFundsSchema.parse(body);
    
    // Check idempotency
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    
    if (existingTransaction) {
      logger.info('Idempotent request, returning existing transaction', {
        transactionId: existingTransaction.id,
      });
      return success(existingTransaction);
    }
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        client: true,
        master: true,
      },
    });
    
    if (!project) {
      return notFound('Project not found');
    }
    
    // Verify user is client
    if (project.client.userId !== userId) {
      return forbidden('You can only reserve funds for your own projects');
    }
    
    // Calculate commission
    const commission = calculateCommission(project.budget);
    const totalAmount = project.budget + commission;
    
    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get or create client wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });
      
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0 },
        });
      }
      
      // Check balance
      if (wallet.balance < totalAmount) {
        throw new Error('Insufficient balance');
      }
      
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalAmount } },
      });
      
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          projectId: data.projectId,
          type: 'RESERVE',
          amount: project.budget,
          commission,
          status: 'COMPLETED',
          idempotencyKey: data.idempotencyKey,
        },
      });
      
      return transaction;
    });
    
    logger.info('Funds reserved', { userId, transactionId: result.id });
    
    return success(result);
  } catch (error) {
    console.error('Error reserving funds:', error);
    
    if (error instanceof z.ZodError) {
      return badRequest(error.errors[0].message);
    }

    if ((error as any).message === 'Insufficient balance') {
      return badRequest('Insufficient balance');
    }

    return badRequest('Failed to reserve funds');
  }
}

export const handler = withRequestTransform(withAuth(reserveFundsHandler));
