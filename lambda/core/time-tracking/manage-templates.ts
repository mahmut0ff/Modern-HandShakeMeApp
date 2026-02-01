// Manage time tracking templates

import type { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { putItem, getItem, queryItems, deleteItem } from '@/shared/db/dynamodb-client';

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  taskType: z.enum(['PREPARATION', 'TRAVEL', 'WORK', 'BREAK', 'CLEANUP', 'DOCUMENTATION', 'OTHER']),
  defaultHourlyRate: z.number().min(0).optional(),
  autoTrackingSettings: z.object({
    enabled: z.boolean().default(false),
    pauseOnIdle: z.boolean().default(true),
    idleThresholdMinutes: z.number().min(1).max(60).default(15),
    autoStopAfterHours: z.number().min(1).max(24).default(12),
    trackLocation: z.boolean().default(true),
    requirePhotos: z.boolean().default(false),
  }).optional(),
  isDefault: z.boolean().optional(),
});

async function manageTemplatesHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const method = event.httpMethod;
  
  logger.info('Manage templates request', { userId, method });
  
  if (method === 'GET') {
    return await getTemplates(userId);
  } else if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const data = validate(templateSchema, body);
    return await createTemplate(userId, data);
  } else if (method === 'DELETE') {
    const templateId = event.pathParameters?.templateId;
    if (!templateId) {
      return badRequest('Template ID is required');
    }
    return await deleteTemplate(userId, templateId);
  }
  
  return badRequest('Invalid method');
}

async function getTemplates(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `MASTER#${userId}#TEMPLATES`,
      },
      ScanIndexForward: false,
    });
    
    const templates = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      taskType: item.taskType,
      defaultHourlyRate: item.defaultHourlyRate,
      autoTrackingSettings: item.autoTrackingSettings,
      isDefault: item.isDefault || false,
      createdAt: item.createdAt,
    }));
    
    logger.info('Templates retrieved', { userId, count: templates.length });
    
    return success({
      templates,
    });
  } catch (error) {
    logger.error('Failed to get templates', error, { userId });
    throw error;
  }
}

async function createTemplate(userId: string, data: any): Promise<APIGatewayProxyResult> {
  try {
    const templateId = uuidv4();
    const now = new Date().toISOString();
    
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      const existingTemplates = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `MASTER#${userId}#TEMPLATES`,
        },
      });
      
      for (const template of existingTemplates) {
        if (template.isDefault) {
          await putItem({
            PK: `TEMPLATE#${template.id}`,
            SK: 'DETAILS',
            ...template,
            isDefault: false,
            updatedAt: now,
          });
        }
      }
    }
    
    const template = {
      id: templateId,
      masterId: userId,
      name: data.name,
      description: data.description,
      taskType: data.taskType,
      defaultHourlyRate: data.defaultHourlyRate,
      autoTrackingSettings: data.autoTrackingSettings || {
        enabled: false,
        pauseOnIdle: true,
        idleThresholdMinutes: 15,
        autoStopAfterHours: 12,
        trackLocation: true,
        requirePhotos: false,
      },
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };
    
    await putItem({
      PK: `TEMPLATE#${templateId}`,
      SK: 'DETAILS',
      ...template,
      GSI1PK: `MASTER#${userId}#TEMPLATES`,
      GSI1SK: `${now}#${templateId}`,
    });
    
    logger.info('Template created', { userId, templateId });
    
    return success({
      template,
      message: 'Template created successfully',
    });
  } catch (error) {
    logger.error('Failed to create template', error, { userId });
    throw error;
  }
}

async function deleteTemplate(userId: string, templateId: string): Promise<APIGatewayProxyResult> {
  try {
    const template = await getItem({
      PK: `TEMPLATE#${templateId}`,
      SK: 'DETAILS',
    });
    
    if (!template) {
      return notFound('Template not found');
    }
    
    if (template.masterId !== userId) {
      return forbidden('Access denied');
    }
    
    await deleteItem({
      PK: `TEMPLATE#${templateId}`,
      SK: 'DETAILS',
    });
    
    logger.info('Template deleted', { userId, templateId });
    
    return success({
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete template', error, { userId, templateId });
    throw error;
  }
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(manageTemplatesHandler)
  )
);
