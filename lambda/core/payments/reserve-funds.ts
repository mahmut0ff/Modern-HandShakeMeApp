import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { WalletRepository } from '../shared/repositories/wallet.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { UserService } from '../shared/services/user.service';
import { verifyToken } from '../shared/services/token';

const walletRepository = new WalletRepository();
const projectRepository = new ProjectRepository();
const userService = new UserService();

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
    
    // Get user to check role
    const user = await userService.findUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    if (user.role !== 'CLIENT') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only clients can reserve funds' })
      };
    }
    
    console.log('Reserve funds request', { userId });
    
    const body = JSON.parse(event.body || '{}');
    const data = reserveFundsSchema.parse(body);
    
    // Check idempotency
    const existingTransaction = await walletRepository.findTransactionByIdempotencyKey(data.idempotencyKey);
    if (existingTransaction) {
      console.log('Idempotent request, returning existing transaction', {
        transactionId: existingTransaction.id,
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingTransaction)
      };
    }
    
    // Get project
    const project = await projectRepository.findProjectById(data.projectId);
    if (!project) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }
    
    // Verify user is client
    if (project.clientId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You can only reserve funds for your own projects' })
      };
    }
    
    // Calculate commission
    const commission = calculateCommission(project.budget);
    const totalAmount = project.budget + commission;
    
    // Get or create client wallet
    let wallet = await walletRepository.findUserWallet(userId);
    if (!wallet) {
      wallet = await walletRepository.createWallet({
        userId,
        balance: 0,
        currency: project.currency,
      });
    }
    
    // Check balance
    if (wallet.balance < totalAmount) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Insufficient balance',
          required: totalAmount,
          available: wallet.balance,
          shortfall: totalAmount - wallet.balance
        })
      };
    }
    
    // Create transaction record first
    const transaction = await walletRepository.createTransaction({
      userId,
      walletId: wallet.id,
      type: 'RESERVE',
      amount: project.budget,
      commission,
      currency: project.currency,
      status: 'PENDING',
      description: `Reserve funds for project: ${project.title}`,
      projectId: data.projectId,
      idempotencyKey: data.idempotencyKey,
    });
    
    try {
      // Deduct from wallet
      await walletRepository.updateBalance(wallet.id, -totalAmount);
      
      // Update transaction status to completed
      await walletRepository.updateTransactionStatus(transaction.id, userId, 'COMPLETED');
      
      console.log('Funds reserved', { userId, transactionId: transaction.id });
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transaction,
          status: 'COMPLETED'
        })
      };
    } catch (error) {
      // If wallet update fails, mark transaction as failed
      await walletRepository.updateTransactionStatus(transaction.id, userId, 'FAILED');
      throw error;
    }
    
  } catch (error) {
    console.error('Error reserving funds:', error);
    
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

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to reserve funds' })
    };
  }
};