/**
 * List Instant Bookings with Filtering and Pagination
 * Список мгновенных бронирований с фильтрацией и пагинацией
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { InstantBookingRepository } from '../shared/repositories/instant-booking.repository';
import { getBookingPermissions, formatBookingResponse } from '../shared/utils/instant-booking';
import { BookingFilters, BookingSort, PaginationInfo } from '../shared/types/instant-booking';

// Validation schema
const listBookingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  role: z.enum(['client', 'master']).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['scheduledDateTime', 'createdAt', 'totalAmount']).default('scheduledDateTime'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserIdFromToken(event.headers.Authorization);
    const userRole = getUserRoleFromToken(event.headers.Authorization);
    
    const queryParams = event.queryStringParameters || {};
    const data = listBookingsSchema.parse(queryParams);
    
    const repository = new InstantBookingRepository();
    
    // Determine which bookings to fetch
    let role: 'client' | 'master';
    if (data.role) {
      role = data.role;
    } else {
      // Default based on user role
      role = userRole === 'MASTER' ? 'master' : 'client';
    }
    
    // Build filters
    const filters: BookingFilters = {
      status: data.status,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      search: data.search
    };
    
    // Build sort
    const sort: BookingSort = {
      sortBy: data.sortBy,
      sortOrder: data.sortOrder
    };
    
    // Get bookings with pagination
    const { bookings, totalCount } = await repository.getUserBookings(
      userId,
      role,
      filters,
      sort,
      data.page,
      data.limit
    );
    
    // Get additional data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [clientProfile, masterProfile, serviceInfo] = await Promise.all([
          repository.getMasterProfile(booking.clientId),
          repository.getMasterProfile(booking.masterId),
          repository.getServiceInfo(booking.serviceId, booking.masterId)
        ]);
        
        const permissions = getBookingPermissions(booking, userId, userRole);
        
        return {
          ...formatBookingResponse(booking),
          client: clientProfile ? {
            id: clientProfile.id,
            name: clientProfile.name,
            avatar: clientProfile.avatar,
            phone: clientProfile.phone,
            rating: clientProfile.rating,
          } : null,
          master: masterProfile ? {
            id: masterProfile.id,
            name: masterProfile.name,
            avatar: masterProfile.avatar,
            phone: masterProfile.phone,
            rating: masterProfile.rating,
            responseTime: masterProfile.responseTime,
          } : null,
          service: serviceInfo ? {
            id: serviceInfo.id,
            name: serviceInfo.name,
            description: serviceInfo.description,
            category: serviceInfo.category,
          } : null,
          ...permissions
        };
      })
    );
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / data.limit);
    const pagination: PaginationInfo = {
      page: data.page,
      limit: data.limit,
      totalCount,
      totalPages,
      hasNextPage: data.page < totalPages,
      hasPreviousPage: data.page > 1,
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        bookings: enrichedBookings,
        pagination,
        filters: {
          status: data.status,
          role: data.role,
          dateFrom: data.dateFrom,
          dateTo: data.dateTo,
          search: data.search,
        },
        sorting: {
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
        },
      })
    };
    
  } catch (error) {
    console.error('List bookings error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'INVALID_REQUEST',
          message: 'Invalid request parameters',
          errors: error.errors
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 'BOOKINGS_RETRIEVAL_FAILED',
        message: 'Failed to retrieve bookings. Please try again.'
      })
    };
  }
};

function getUserIdFromToken(authHeader?: string): string {
  // This is a simplified version - implement proper JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // In production, verify JWT and extract userId
  return 'user_123'; // Placeholder
}

function getUserRoleFromToken(authHeader?: string): string {
  // This is a simplified version - implement proper JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  // In production, verify JWT and extract user role
  return 'CLIENT'; // Placeholder
}