import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createResponse, createErrorResponse } from '@/shared/utils/response';
import { CacheService } from '@/shared/services/cache';

const prisma = new PrismaClient();
const cache = new CacheService();

// Query parameters validation schema
const querySchema = z.object({
  latitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number),
  longitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number),
  radius: z.string().regex(/^\d+$/).transform(Number).default(10), // km
  categoryId: z.string().uuid().optional(),
  services: z.string().optional(), // comma-separated service names
  minRating: z.string().regex(/^\d+\.?\d*$/).transform(Number).optional(),
  verified: z.enum(['true', 'false']).optional(),
  available: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default(20),
  offset: z.string().regex(/^\d+$/).transform(Number).default(0)
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const validatedQuery = querySchema.parse(queryParams);

    // Validate coordinates
    if (Math.abs(validatedQuery.latitude) > 90) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid latitude');
    }
    if (Math.abs(validatedQuery.longitude) > 180) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid longitude');
    }
    if (validatedQuery.radius > 100) {
      return createErrorResponse(400, 'VALIDATION_ERROR', 'Maximum radius is 100km');
    }

    // Check cache first
    const cacheKey = `nearby-masters:${JSON.stringify(validatedQuery)}`;
    const cachedResults = await cache.get(cacheKey);
    
    if (cachedResults) {
      return createResponse(200, cachedResults);
    }

    // Build base query for masters with location data
    const whereClause: any = {
      latitude: { not: null },
      longitude: { not: null }
    };

    if (validatedQuery.categoryId) {
      whereClause.categoryId = validatedQuery.categoryId;
    }

    if (validatedQuery.minRating) {
      whereClause.rating = { gte: validatedQuery.minRating };
    }

    if (validatedQuery.verified === 'true') {
      whereClause.isVerified = true;
    }

    // Get masters within a rough bounding box first (for performance)
    const latDelta = validatedQuery.radius / 111; // Rough conversion: 1 degree ≈ 111 km
    const lngDelta = validatedQuery.radius / (111 * Math.cos(validatedQuery.latitude * Math.PI / 180));

    whereClause.latitude = {
      gte: validatedQuery.latitude - latDelta,
      lte: validatedQuery.latitude + latDelta
    };
    whereClause.longitude = {
      gte: validatedQuery.longitude - lngDelta,
      lte: validatedQuery.longitude + lngDelta
    };

    // Fetch masters
    const masters = await prisma.masterProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        services: validatedQuery.services ? {
          where: {
            isActive: true,
            ...(validatedQuery.services && {
              name: {
                in: validatedQuery.services.split(',').map(s => s.trim())
              }
            })
          },
          select: {
            id: true,
            name: true,
            priceFrom: true,
            priceTo: true,
            unit: true
          }
        } : {
          where: { isActive: true },
          take: 3,
          select: {
            id: true,
            name: true,
            priceFrom: true,
            priceTo: true,
            unit: true
          }
        },
        portfolio: {
          where: { isPublic: true },
          take: 3,
          select: {
            id: true,
            title: true,
            images: true
          }
        },
        availability: validatedQuery.available === 'true' ? {
          select: {
            workingHours: true
          }
        } : false
      },
      take: validatedQuery.limit * 2 // Get more to filter by distance
    });

    // Calculate exact distances and filter
    const mastersWithDistance = masters
      .map(master => {
        if (!master.latitude || !master.longitude) return null;
        
        const distance = calculateDistance(
          validatedQuery.latitude,
          validatedQuery.longitude,
          Number(master.latitude),
          Number(master.longitude)
        );

        if (distance > validatedQuery.radius) return null;

        // Check availability if requested
        let isAvailable = true;
        if (validatedQuery.available === 'true' && master.availability) {
          isAvailable = checkCurrentAvailability(master.availability.workingHours);
        }

        if (validatedQuery.available === 'true' && !isAvailable) return null;

        return {
          id: master.id,
          userId: master.user.id,
          companyName: master.companyName,
          description: master.description,
          experienceYears: master.experienceYears,
          city: master.city,
          category: master.category,
          rating: Number(master.rating),
          completedProjectsCount: master.completedProjectsCount,
          onTimeRate: Number(master.onTimeRate),
          isVerified: master.isVerified,
          avatar: master.user.avatar,
          distance: Math.round(distance * 100) / 100,
          coordinates: {
            latitude: Number(master.latitude),
            longitude: Number(master.longitude)
          },
          services: master.services.map(service => ({
            id: service.id,
            name: service.name,
            priceFrom: Number(service.priceFrom),
            priceTo: service.priceTo ? Number(service.priceTo) : null,
            unit: service.unit
          })),
          portfolio: master.portfolio.map(item => ({
            id: item.id,
            title: item.title,
            image: item.images[0] || null
          })),
          isAvailable: validatedQuery.available === 'true' ? isAvailable : undefined
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance)
      .slice(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit);

    // Get total count for pagination
    const totalCount = mastersWithDistance.length;

    // Calculate statistics
    const stats = {
      total: totalCount,
      averageDistance: totalCount > 0 ? 
        Math.round((mastersWithDistance.reduce((sum, m) => sum + m!.distance, 0) / totalCount) * 100) / 100 : 0,
      averageRating: totalCount > 0 ?
        Math.round((mastersWithDistance.reduce((sum, m) => sum + m!.rating, 0) / totalCount) * 100) / 100 : 0,
      verified: mastersWithDistance.filter(m => m!.isVerified).length,
      byCategory: mastersWithDistance.reduce((acc, m) => {
        const categoryName = m!.category?.name || 'Other';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const response = {
      masters: mastersWithDistance,
      searchParams: {
        latitude: validatedQuery.latitude,
        longitude: validatedQuery.longitude,
        radius: validatedQuery.radius,
        categoryId: validatedQuery.categoryId,
        services: validatedQuery.services?.split(',').map(s => s.trim()),
        minRating: validatedQuery.minRating,
        verified: validatedQuery.verified === 'true',
        available: validatedQuery.available === 'true'
      },
      pagination: {
        total: totalCount,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: validatedQuery.offset + validatedQuery.limit < totalCount
      },
      stats
    };

    // Cache the response for 10 minutes
    await cache.set(cacheKey, response, 600);

    return createResponse(200, response);

  } catch (error) {
    console.error('Error finding nearby masters:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'VALIDATION_ERROR', error.errors[0].message);
    }

    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to find nearby masters');
  } finally {
    await prisma.$disconnect();
  }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function checkCurrentAvailability(workingHours: any): boolean {
  if (!workingHours) return false;
  
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  
  const dayHours = workingHours[dayName];
  if (!dayHours || !dayHours.enabled) return false;
  
  return currentTime >= dayHours.start && currentTime <= dayHours.end;
}