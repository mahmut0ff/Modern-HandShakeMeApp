import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { requireAuth } from '@/shared/middleware/auth';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  masterId: z.string().uuid().optional()
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await requireAuth()(event);
    
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Determine which master's verification to fetch
    let targetMasterId: string;
    
    if (validatedQuery.masterId) {
      // Admin or specific master lookup
      if (user.role !== 'ADMIN' && user.role !== 'MASTER') {
        return createErrorResponse(403, 'FORBIDDEN', 'Access denied');
      }
      
      // If not admin, can only view own verification
      if (user.role !== 'ADMIN') {
        const masterProfile = await prisma.masterProfile.findUnique({
          where: { userId: user.userId },
          select: { id: true }
        });
        
        if (!masterProfile || masterProfile.id !== validatedQuery.masterId) {
          return createErrorResponse(403, 'FORBIDDEN', 'Can only view your own verification status');
        }
      }
      
      targetMasterId = validatedQuery.masterId;
    } else {
      // Get own verification
      if (user.role !== 'MASTER') {
        return createErrorResponse(403, 'FORBIDDEN', 'Only masters can view verification status');
      }
      
      const masterProfile = await prisma.masterProfile.findUnique({
        where: { userId: user.userId },
        select: { id: true }
      });
      
      if (!masterProfile) {
        return createErrorResponse(404, 'NOT_FOUND', 'Master profile not found');
      }
      
      targetMasterId = masterProfile.id;
    }

    // Check cache first
    const cacheKey = `verification:${targetMasterId}:status`;
    const cachedStatus = await cache.get(cacheKey);
    
    if (cachedStatus) {
      return createResponse(200, cachedStatus);
    }

    // Get verification record
    const verification = await prisma.masterVerification.findUnique({
      where: { masterId: targetMasterId },
      include: {
        reviewer: user.role === 'ADMIN' ? {
          select: {
            id: true,
            email: true
          }
        } : false
      }
    });

    if (!verification) {
      return createResponse(200, {
        masterId: targetMasterId,
        status: 'NOT_SUBMITTED',
        message: 'No verification documents have been submitted',
        documents: {
          passport: false,
          license: false,
          certificates: 0
        },
        timeline: []
      });
    }

    // Build timeline
    const timeline = [];
    
    if (verification.submittedAt) {
      timeline.push({
        status: 'SUBMITTED',
        date: verification.submittedAt.toISOString(),
        description: 'Documents submitted for review'
      });
    }
    
    if (verification.status === 'UNDER_REVIEW' && verification.reviewedAt) {
      timeline.push({
        status: 'UNDER_REVIEW',
        date: verification.reviewedAt.toISOString(),
        description: 'Review started',
        ...(user.role === 'ADMIN' && verification.reviewer && {
          reviewer: verification.reviewer.email
        })
      });
    }
    
    if (verification.status === 'VERIFIED' && verification.reviewedAt) {
      timeline.push({
        status: 'VERIFIED',
        date: verification.reviewedAt.toISOString(),
        description: 'Documents verified successfully',
        ...(user.role === 'ADMIN' && verification.reviewer && {
          reviewer: verification.reviewer.email
        })
      });
    }
    
    if (verification.status === 'REJECTED' && verification.reviewedAt) {
      timeline.push({
        status: 'REJECTED',
        date: verification.reviewedAt.toISOString(),
        description: 'Documents rejected',
        reason: verification.rejectionReason,
        ...(user.role === 'ADMIN' && verification.reviewer && {
          reviewer: verification.reviewer.email
        })
      });
    }

    // Calculate estimated completion time
    let estimatedCompletion = null;
    if (verification.status === 'PENDING' && verification.submittedAt) {
      const businessDays = 3; // 2-3 business days
      const submissionDate = new Date(verification.submittedAt);
      const estimatedDate = new Date(submissionDate);
      estimatedDate.setDate(estimatedDate.getDate() + businessDays);
      estimatedCompletion = estimatedDate.toISOString();
    }

    const response = {
      verificationId: verification.id,
      masterId: targetMasterId,
      status: verification.status,
      submittedAt: verification.submittedAt?.toISOString(),
      reviewedAt: verification.reviewedAt?.toISOString(),
      rejectionReason: verification.rejectionReason,
      estimatedCompletion,
      documents: {
        passport: !!verification.passportUrl,
        license: !!verification.licenseUrl,
        certificates: verification.certificateUrls.length,
        ...(user.role === 'ADMIN' && {
          passportUrl: verification.passportUrl,
          licenseUrl: verification.licenseUrl,
          certificateUrls: verification.certificateUrls
        })
      },
      timeline,
      ...(user.role === 'ADMIN' && verification.reviewer && {
        reviewer: verification.reviewer
      })
    };

    // Cache the response for 5 minutes
    await cache.set(cacheKey, response, 300);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting verification status:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return createErrorResponse(401, 'UNAUTHORIZED', error.message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get verification status');
  } finally {
    await prisma.$disconnect();
  }
};