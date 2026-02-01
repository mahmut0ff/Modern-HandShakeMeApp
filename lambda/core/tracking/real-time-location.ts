// Real-time location tracking for masters and orders

import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, notFound, forbidden } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { NotificationService } from '@/shared/services/notification';
import { WebSocketService } from '@/shared/services/websocket.service';
import { LocationRepository } from '@/shared/repositories/location.repository';
import { v4 as uuidv4 } from 'uuid';

const locationTrackingSchema = z.object({
  action: z.enum(['START_TRACKING', 'UPDATE_LOCATION', 'STOP_TRACKING', 'GET_LOCATION', 'GET_TRACKING_HISTORY']),
  bookingId: z.string().optional(),
  projectId: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    altitude: z.number().optional(),
    heading: z.number().optional(),
    speed: z.number().optional(),
  }).optional(),
  trackingSettings: z.object({
    updateInterval: z.number().min(5).max(300).default(30), // seconds
    highAccuracyMode: z.boolean().default(true),
    shareWithClient: z.boolean().default(true),
    autoStopAfterCompletion: z.boolean().default(true),
    geofenceRadius: z.number().min(50).max(1000).default(100), // meters
  }).optional(),
  timeRange: z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  }).optional(),
});

async function realTimeLocationHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  const userRole = event.auth.role;
  
  logger.info('Real-time location tracking request', { userId, userRole });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(locationTrackingSchema, body);
  
  const locationRepository = new LocationRepository();
  const notificationService = new NotificationService();
  const webSocketService = new WebSocketService();
  
  try {
    switch (data.action) {
      case 'START_TRACKING':
        return await startLocationTracking(userId, userRole, data, locationRepository, notificationService);
      case 'UPDATE_LOCATION':
        return await updateLocation(userId, userRole, data, locationRepository, webSocketService);
      case 'STOP_TRACKING':
        return await stopLocationTracking(userId, userRole, data, locationRepository, notificationService);
      case 'GET_LOCATION':
        return await getCurrentLocation(userId, userRole, data, locationRepository);
      case 'GET_TRACKING_HISTORY':
        return await getTrackingHistory(userId, userRole, data, locationRepository);
      default:
        return badRequest('Invalid action');
    }
  } catch (error) {
    logger.error('Location tracking request failed', { userId, action: data.action, error });
    throw error;
  }
}

async function startLocationTracking(
  userId: string,
  userRole: string,
  data: any,
  locationRepository: LocationRepository,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can start location tracking');
  }
  
  if (!data.bookingId && !data.projectId) {
    return badRequest('Booking ID or Project ID is required to start tracking');
  }
  
  // Check if tracking is already active
  const existingTracking = await locationRepository.findActiveTrackingByMaster(
    userId, 
    data.bookingId, 
    data.projectId
  );
  
  if (existingTracking) {
    return badRequest('Location tracking is already active for this booking/project');
  }
  
  // Create tracking session
  const trackingId = uuidv4();
  const now = new Date().toISOString();
  
  const tracking = await locationRepository.createLocationTracking({
    id: trackingId,
    masterId: userId,
    bookingId: data.bookingId,
    projectId: data.projectId,
    status: 'ACTIVE',
    settings: data.trackingSettings || {},
    startedAt: now,
    createdAt: now,
    updatedAt: now
  });
  
  // Create initial location entry if provided
  if (data.location) {
    await locationRepository.createLocationUpdate({
      id: uuidv4(),
      trackingId,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
      altitude: data.location.altitude,
      heading: data.location.heading,
      speed: data.location.speed,
      timestamp: now,
      createdAt: now
    });
  }
  
  // Notify client if sharing is enabled
  if (data.trackingSettings?.shareWithClient !== false) {
    try {
      await notificationService.sendLocationTrackingNotification(
        data.bookingId || data.projectId,
        'TRACKING_STARTED',
        {
          masterId: userId,
          trackingId,
          bookingId: data.bookingId,
          projectId: data.projectId,
        }
      );
    } catch (error) {
      logger.warn('Failed to send tracking notification', { error });
    }
  }
  
  logger.info('Location tracking started', { 
    trackingId, 
    masterId: userId,
    bookingId: data.bookingId,
    projectId: data.projectId 
  });
  
  return success({
    tracking: {
      id: tracking.id,
      status: tracking.status,
      settings: tracking.settings,
      startedAt: tracking.startedAt,
    },
    message: 'Location tracking started successfully',
    trackingUrl: `${process.env.FRONTEND_URL}/tracking/${trackingId}`,
  });
}

async function updateLocation(
  userId: string,
  userRole: string,
  data: any,
  locationRepository: LocationRepository,
  webSocketService: WebSocketService
): Promise<APIGatewayProxyResult> {
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can update location');
  }
  
  if (!data.location) {
    return badRequest('Location data is required');
  }
  
  if (!data.bookingId && !data.projectId) {
    return badRequest('Booking ID or Project ID is required');
  }
  
  // Find active tracking session
  const tracking = await locationRepository.findActiveTrackingByMaster(
    userId, 
    data.bookingId, 
    data.projectId
  );
  
  if (!tracking) {
    return notFound('No active tracking session found');
  }
  
  // Create location update
  const now = new Date().toISOString();
  const locationUpdate = await locationRepository.createLocationUpdate({
    id: uuidv4(),
    trackingId: tracking.id,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    accuracy: data.location.accuracy,
    altitude: data.location.altitude,
    heading: data.location.heading,
    speed: data.location.speed,
    timestamp: now,
    createdAt: now
  });
  
  // Check geofence if destination coordinates are available
  let geofenceStatus = null;
  if (tracking.settings?.geofenceRadius) {
    // For now, we'll skip geofence checking as it requires booking/project data
    // This can be enhanced later with proper booking/project repository integration
  }
  
  // Broadcast location update via WebSocket if sharing is enabled
  if (tracking.settings?.shareWithClient !== false) {
    try {
      await webSocketService.broadcastLocationUpdate(data.bookingId || data.projectId, {
        trackingId: tracking.id,
        masterId: userId,
        location: data.location,
        timestamp: locationUpdate.timestamp,
        geofenceStatus,
      });
    } catch (error) {
      logger.warn('Failed to broadcast location update', { error });
    }
  }
  
  // Update tracking session
  await locationRepository.updateLocationTracking(tracking.id, {
    lastUpdateAt: now,
    currentLatitude: data.location.latitude,
    currentLongitude: data.location.longitude,
  });
  
  logger.info('Location updated', { 
    trackingId: tracking.id,
    masterId: userId,
    coordinates: `${data.location.latitude},${data.location.longitude}` 
  });
  
  return success({
    locationUpdate: {
      id: locationUpdate.id,
      timestamp: locationUpdate.timestamp,
      geofenceStatus,
    },
    message: 'Location updated successfully',
  });
}

async function stopLocationTracking(
  userId: string,
  userRole: string,
  data: any,
  locationRepository: LocationRepository,
  notificationService: NotificationService
): Promise<APIGatewayProxyResult> {
  if (userRole !== 'MASTER') {
    return forbidden('Only masters can stop location tracking');
  }
  
  if (!data.bookingId && !data.projectId) {
    return badRequest('Booking ID or Project ID is required');
  }
  
  // Find active tracking session
  const tracking = await locationRepository.findActiveTrackingByMaster(
    userId, 
    data.bookingId, 
    data.projectId
  );
  
  if (!tracking) {
    return notFound('No active tracking session found');
  }
  
  // Get location updates for statistics
  const locationUpdates = await locationRepository.getLocationUpdates(tracking.id);
  
  // Calculate tracking statistics
  const stats = calculateTrackingStats(locationUpdates);
  
  // Stop tracking
  const now = new Date().toISOString();
  await locationRepository.updateLocationTracking(tracking.id, {
    status: 'COMPLETED',
    endedAt: now,
    stats,
  });
  
  // Notify client
  if (tracking.settings?.shareWithClient !== false) {
    try {
      await notificationService.sendLocationTrackingNotification(
        data.bookingId || data.projectId,
        'TRACKING_STOPPED',
        {
          masterId: userId,
          trackingId: tracking.id,
          stats,
        }
      );
    } catch (error) {
      logger.warn('Failed to send tracking stopped notification', { error });
    }
  }
  
  logger.info('Location tracking stopped', { 
    trackingId: tracking.id,
    masterId: userId,
    duration: stats.duration,
    totalDistance: stats.totalDistance 
  });
  
  return success({
    tracking: {
      id: tracking.id,
      status: 'COMPLETED',
      endedAt: now,
      stats,
    },
    message: 'Location tracking stopped successfully',
  });
}

async function getCurrentLocation(
  userId: string,
  userRole: string,
  data: any,
  locationRepository: LocationRepository
): Promise<APIGatewayProxyResult> {
  if (!data.bookingId && !data.projectId) {
    return badRequest('Booking ID or Project ID is required');
  }
  
  // Find tracking session
  const tracking = await locationRepository.findActiveTrackingByMaster(
    userId, 
    data.bookingId, 
    data.projectId
  );
  
  if (!tracking) {
    return notFound('No active tracking session found');
  }
  
  // Check permissions
  const canView = 
    tracking.masterId === userId || // Master can always view
    (userRole === 'CLIENT' && tracking.settings?.shareWithClient !== false) || // Client can view if sharing enabled
    userRole === 'ADMIN'; // Admin can always view
  
  if (!canView) {
    return forbidden('You do not have permission to view this location');
  }
  
  const latestLocation = await locationRepository.getLatestLocationUpdate(tracking.id);
  
  if (!latestLocation) {
    return success({
      tracking: {
        id: tracking.id,
        status: tracking.status,
        startedAt: tracking.startedAt,
      },
      location: null,
      message: 'No location data available yet',
    });
  }
  
  return success({
    tracking: {
      id: tracking.id,
      status: tracking.status,
      startedAt: tracking.startedAt,
      lastUpdateAt: tracking.lastUpdateAt,
    },
    location: {
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      accuracy: latestLocation.accuracy,
      heading: latestLocation.heading,
      speed: latestLocation.speed,
      timestamp: latestLocation.timestamp,
    },
    message: 'Current location retrieved successfully',
  });
}

async function getTrackingHistory(
  userId: string,
  userRole: string,
  data: any,
  locationRepository: LocationRepository
): Promise<APIGatewayProxyResult> {
  if (!data.bookingId && !data.projectId) {
    return badRequest('Booking ID or Project ID is required');
  }
  
  // Find tracking session (can be completed or active)
  const tracking = await locationRepository.getLocationTracking(data.trackingId) ||
    await locationRepository.findActiveTrackingByMaster(userId, data.bookingId, data.projectId);
  
  if (!tracking) {
    return notFound('No tracking session found');
  }
  
  // Check permissions
  const canView = 
    tracking.masterId === userId ||
    (userRole === 'CLIENT' && tracking.settings?.shareWithClient !== false) ||
    userRole === 'ADMIN';
  
  if (!canView) {
    return forbidden('You do not have permission to view this tracking history');
  }
  
  // Get location updates with optional time range filter
  const locationUpdates = await locationRepository.getLocationUpdates(
    tracking.id,
    data.timeRange?.startTime,
    data.timeRange?.endTime
  );
  
  // Calculate route statistics
  const routeStats = calculateTrackingStats(locationUpdates);
  
  return success({
    tracking: {
      id: tracking.id,
      status: tracking.status,
      startedAt: tracking.startedAt,
      endedAt: tracking.endedAt,
      stats: tracking.stats || routeStats,
    },
    locationHistory: locationUpdates.map(update => ({
      latitude: update.latitude,
      longitude: update.longitude,
      accuracy: update.accuracy,
      heading: update.heading,
      speed: update.speed,
      timestamp: update.timestamp,
    })),
    routeStats,
    message: 'Tracking history retrieved successfully',
  });
}

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function calculateTrackingStats(locationUpdates: any[]) {
  if (locationUpdates.length === 0) {
    return {
      duration: 0,
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      pointsCount: 0,
    };
  }
  
  let totalDistance = 0;
  let maxSpeed = 0;
  const speeds: number[] = [];
  
  for (let i = 1; i < locationUpdates.length; i++) {
    const prev = locationUpdates[i - 1];
    const curr = locationUpdates[i];
    
    const distance = calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
    
    totalDistance += distance;
    
    if (curr.speed) {
      speeds.push(curr.speed);
      maxSpeed = Math.max(maxSpeed, curr.speed);
    }
  }
  
  const startTime = new Date(locationUpdates[0].timestamp);
  const endTime = new Date(locationUpdates[locationUpdates.length - 1].timestamp);
  const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
  
  const averageSpeed = speeds.length > 0 
    ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length 
    : 0;
  
  return {
    duration,
    totalDistance: Math.round(totalDistance),
    averageSpeed: Math.round(averageSpeed * 100) / 100,
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    pointsCount: locationUpdates.length,
  };
}

async function handleMasterArrival(
  tracking: any, 
  locationRepository: LocationRepository, 
  webSocketService: WebSocketService
) {
  // Create arrival event
  await locationRepository.createTrackingEvent({
    id: uuidv4(),
    trackingId: tracking.id,
    eventType: 'ARRIVAL',
    timestamp: new Date().toISOString(),
    description: 'Master arrived at destination',
    createdAt: new Date().toISOString(),
  });
  
  // Notify client via WebSocket
  try {
    await webSocketService.broadcastTrackingEvent(tracking.bookingId || tracking.projectId, {
      trackingId: tracking.id,
      eventType: 'ARRIVAL',
      timestamp: new Date().toISOString(),
      message: 'Мастер прибыл к месту выполнения работ',
    });
  } catch (error) {
    logger.warn('Failed to broadcast arrival event', { error });
  }
  
  logger.info('Master arrival detected', { 
    trackingId: tracking.id,
    masterId: tracking.masterId 
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(realTimeLocationHandler)
  )
);