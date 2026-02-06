// List project payments

import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { WalletRepository } from '../shared/repositories/wallet.repository';

const projectRepository = new ProjectRepository();
const walletRepository = new WalletRepository();

const listProjectPaymentsHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const projectId = event.pathParameters?.id;
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('List project payments request', { userId, projectId });
  
  // Get project to verify ownership
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can view payments
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to view payments for this project');
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
  
  return success(payments);
};

export const handler = withErrorHandler(withAuth(listProjectPaymentsHandler));
