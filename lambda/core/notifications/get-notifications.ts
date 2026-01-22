// Get notifications for current user

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '@/shared/db/client';
import { success } from '@/shared/utils/response';
import { paginationSchema, validateSafe } from '@/shared/utils/validation';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { logger } from '@/shared/utils/logger';

const filterSchema = paginationSchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

async function getNotificationsHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  logger.info('Get notifications', { userId });
  
  const result = validateSafe(filterSchema, event.queryStringParameters || {});
  
  if (!result.success) {
    return success({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
  
  const { page, limit, unreadOnly } = result.data;
  
  const prisma = getPrismaClient();
  
  const where: any = {
    userId,
    ...(unreadOnly && { isRead: false }),
  };
  
  const total = await prisma.notification.count({ where });
  
  const notifications = await prisma.notification.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  
  return success({
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export const handler = withErrorHandler(withAuth(getNotificationsHandler));
