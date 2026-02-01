// List project payments

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { WalletRepository, Transaction } from '../shared/repositories/wallet.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const projectRepository = new ProjectRepository();
const walletRepository = new WalletRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project ID is required' })
      };
    }
    
    console.log('List project payments request', { userId: decoded.userId, projectId });
    
    // Get project to verify ownership
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }
    
    // Only client or master can view payments
    if (project.clientId !== decoded.userId && project.masterId !== decoded.userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to view payments for this project' })
      };
    }
    
    // Get project-related transactions
    const transactions = await walletRepository.findProjectTransactions(projectId);
    
    // Format transactions for response
    const payments = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      description: transaction.description,
      userId: transaction.userId,
      walletId: transaction.walletId,
      projectId: transaction.projectId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payments)
    };
  } catch (error) {
    console.error('Error listing project payments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
