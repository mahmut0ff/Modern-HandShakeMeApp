import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { validateInput } from '@/shared/utils/validation';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';
import { S3Service } from '@/shared/services/s3';
import { NotificationService } from '@/shared/services/notification';

const prisma = new PrismaClient();
const cache = new CacheService();
const s3Service = new S3Service();
const notificationService = new NotificationService();

// Validation schema
const addEvidenceSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  evidence: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO']),
    url: z.string().url('Invalid evidence URL'),
    description: z.string().max(200, 'Evidence description too long').optional()
  })).min(1, 'At least one evidence item is required').max(5, 'Maximum 5 evidence items per submission')
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);

    const body = JSON.parse(event.body || '{}');
    const validatedData = validateInput(addEvidenceSchema)(body);

    // Check if dispute exists and user is involved
    const dispute = await prisma.dispute.findUnique({
      where: { id: validatedData.disputeId },
      include: {
        project: {
          include: {
            order: {
              select: {
                title: true,
                clientId: true,
                masterId: true
              }
            }
          }
        }
      }
    });

    if (!dispute) {
      return createErrorResponse(404, 'NOT_FOUND', 'Dispute not found');
    }

    // Verify user is involved in the dispute
    const isClient = dispute.clientId === user.userId;
    const isMaster = dispute.masterId === user.userId;
    
    if (!isClient && !isMaster && user.role !== 'ADMIN') {
      return createErrorResponse(403, 'FORBIDDEN', 'You are not involved in this dispute');
    }

    // Check if dispute is still open for evidence
    if (!['OPEN', 'IN_REVIEW'].includes(dispute.status)) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Cannot add evidence to a resolved or closed dispute');
    }

    // Check evidence limit per user
    const existingEvidenceCount = await prisma.disputeEvidence.count({
      where: {
        disputeId: validatedData.disputeId,
        uploadedById: user.userId
      }
    });

    if (existingEvidenceCount + validatedData.evidence.length > 10) {
      return createErrorResponse(409, 'LIMIT_EXCEEDED', 'Maximum 10 evidence items per user per dispute');
    }

    // Validate evidence URLs
    for (const evidence of validatedData.evidence) {
      let isValid = false;
      
      switch (evidence.type) {
        case 'IMAGE':
          isValid = await s3Service.validateImageUrl(evidence.url);
          break;
        case 'DOCUMENT':
        case 'VIDEO':
          isValid = await s3Service.validateDocumentUrl(evidence.url);
          break;
      }
      
      if (!isValid) {
        return createErrorResponse(400, 'VALIDATION_ERROR', `Invalid ${evidence.type.toLowerCase()} URL: ${evidence.url}`);
      }
    }

    // Add evidence to dispute
    const evidenceRecords = await prisma.disputeEvidence.createMany({
      data: validatedData.evidence.map(evidence => ({
        disputeId: validatedData.disputeId,
        type: evidence.type,
        url: evidence.url,
        description: evidence.description,
        uploadedById: user.userId
      }))
    });

    // Add timeline entry
    await prisma.disputeTimeline.create({
      data: {
        disputeId: validatedData.disputeId,
        action: 'EVIDENCE_ADDED',
        description: `${isClient ? 'Client' : 'Master'} added ${validatedData.evidence.length} evidence item(s)`,
        userId: user.userId
      }
    });

    // Notify the other party
    const otherPartyId = isClient ? dispute.masterId : dispute.clientId;
    
    await notificationService.sendNotification({
      userId: otherPartyId,
      type: 'DISPUTE_EVIDENCE_ADDED',
      title: 'Новые доказательства в споре',
      message: `${isClient ? 'Клиент' : 'Мастер'} добавил новые доказательства в спор по заказу "${dispute.project?.order?.title}"`,
      data: {
        disputeId: dispute.id,
        evidenceCount: validatedData.evidence.length,
        addedBy: user.userId
      }
    });

    // Notify admin if dispute is under review
    if (dispute.status === 'IN_REVIEW') {
      await notificationService.sendAdminNotification({
        type: 'DISPUTE_EVIDENCE_ADDED',
        title: 'Новые доказательства в споре под рассмотрением',
        message: `Добавлены новые доказательства в спор ${dispute.id}`,
        data: {
          disputeId: dispute.id,
          evidenceCount: validatedData.evidence.length,
          addedBy: user.userId
        }
      });
    }

    // Invalidate cache
    await cache.invalidatePattern(`disputes:${user.userId}*`);
    await cache.invalidatePattern(`dispute:${validatedData.disputeId}*`);

    console.log(`Evidence added to dispute: ${validatedData.disputeId} by user ${user.userId}`);

    return createResponse(201, {
      disputeId: validatedData.disputeId,
      evidenceAdded: validatedData.evidence.length,
      totalEvidence: existingEvidenceCount + validatedData.evidence.length,
      message: 'Evidence added successfully',
      evidence: validatedData.evidence.map((evidence, index) => ({
        type: evidence.type,
        description: evidence.description,
        uploadedAt: new Date().toISOString()
      }))
    });

  } catch (error) {
    console.error('Error adding dispute evidence:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to add dispute evidence');
  } finally {
    await prisma.$disconnect();
  }
};