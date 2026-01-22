// GDPR data export

import type { APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

async function exportDataHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('GDPR data export request', { userId });
  
  const prisma = getPrismaClient();
  
  // Export all user data
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      masterProfile: {
        include: {
          skills: true,
          categories: true,
          portfolio: true,
        },
      },
      clientProfile: true,
      sentMessages: true,
      notifications: true,
      reviews: true,
      transactions: true,
    },
  });
  
  // Get orders if client
  let orders = [];
  if (userData?.clientProfile) {
    orders = await prisma.order.findMany({
      where: { clientId: userData.clientProfile.id },
      include: {
        applications: true,
        project: true,
      },
    });
  }
  
  // Get applications if master
  let applications = [];
  if (userData?.masterProfile) {
    applications = await prisma.application.findMany({
      where: { masterId: userData.masterProfile.id },
    });
  }
  
  // Get projects
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { master: { userId } },
        { client: { userId } },
      ],
    },
  });
  
  const exportData = {
    user: userData,
    orders,
    applications,
    projects,
    exportedAt: new Date().toISOString(),
  };
  
  logger.info('Data exported', { userId });
  
  return success(exportData);
}

export const handler = withErrorHandler(withAuth(exportDataHandler));
