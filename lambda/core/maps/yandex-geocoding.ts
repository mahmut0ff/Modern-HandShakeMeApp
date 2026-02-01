import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { success, badRequest, serverError } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { LocationRepository } from '@/shared/repositories/location.repository';
import { CacheService } from '@/shared/services/cache.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Configuration
const CONFIG = {
  YANDEX_API: {
    GEOCODING_URL: 'https://geocode-maps.yandex.ru/1.x/',
    PLACES_URL: 'https://search-maps.yandex.ru/v1/',
    ROUTING_URL: 'https://api.routing.yandex.net/v2/route',
    TIMEOUT: {
      GEOCODING: parseInt(process.env.YANDEX_GEOCODING_TIMEOUT || '10000'),
      PLACES: parseInt(process.env.YANDEX_PLACES_TIMEOUT || '10000'),
      ROUTING: parseInt(process.env.YANDEX_ROUTING_TIMEOUT || '15000'),
    },
    RETRY: {
      MAX_ATTEMPTS: parseInt(process.env.YANDEX_MAX_RETRIES || '3'),
      INITIAL_DELAY: parseInt(process.env.YANDEX_RETRY_DELAY || '1000'),
    },
  },
  RATE_LIMITS: {
    GEOCODING: parseInt(process.env.GEOCODING_RATE_LIMIT || '100'), // per hour
    PLACES: parseInt(process.env.PLACES_RATE_LIMIT || '50'), // per hour
    ROUTING: parseInt(process.env.ROUTING_RATE_LIMIT || '20'), // per hour
  },
  CACHE_TTL: {
    MEMORY: {
      GEOCODING: parseInt(process.env.MEMORY_CACHE_GEOCODING_TTL || '3600'), // 1 hour
      PLACES: parseInt(process.env.MEMORY_CACHE_PLACES_TTL || '1800'), // 30 minutes
      ROUTING: parseInt(process.env.MEMORY_CACHE_ROUTING_TTL || '900'), // 15 minutes
    },
    DB: {
      GEOCODING: parseInt(process.env.DB_CACHE_GEOCODING_TTL || '86400'), // 24 hours
      PLACES: parseInt(process.env.DB_CACHE_PLACES_TTL || '21600'), // 6 hours
      ROUTING: parseInt(process.env.DB_CACHE_ROUTING_TTL || '7200'), // 2 hours
    },
  },
};

// Rate limiting storage
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

const geocodingSchema = z.object({
  action: z.enum(['GEOCODE', 'REVERSE_GEOCODE', 'SEARCH_PLACES', 'GET_ROUTE', 'CALCULATE_DISTANCE']),
  address: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  query: z.string().optional(),
  origin: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  destination: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).optional(),
  routeOptions: z.object({
    mode: z.enum(['driving', 'walking', 'transit', 'bicycle']).default('driving'),
    avoidTolls: z.boolean().default(false),
    avoidHighways: z.boolean().default(false),
    avoidFerries: z.boolean().default(false),
    optimize: z.boolean().default(true),
  }).optional(),
  searchOptions: z.object({
    category: z.string().optional(),
    radius: z.number().min(100).max(50000).default(5000), // meters
    limit: z.number().min(1).max(50).default(10),
    language: z.enum(['ru', 'en', 'tr', 'uk']).default('ru'),
  }).optional(),
  cacheResults: z.boolean().default(true),
});

// Rate limiting functions
function checkRateLimit(userId: string, action: string): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  let limit: number;
  switch (action) {
    case 'GEOCODE':
    case 'REVERSE_GEOCODE':
      limit = CONFIG.RATE_LIMITS.GEOCODING;
      break;
    case 'SEARCH_PLACES':
      limit = CONFIG.RATE_LIMITS.PLACES;
      break;
    case 'GET_ROUTE':
      limit = CONFIG.RATE_LIMITS.ROUTING;
      break;
    default:
      limit = 10; // Default limit
  }
  
  const current = rateLimitCache.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitCache.set(key, { count: 1, resetTime: now + hourInMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

function getRateLimitInfo(userId: string, action: string): { remaining: number; resetTime: number } {
  const key = `${userId}:${action}`;
  const current = rateLimitCache.get(key);
  
  let limit: number;
  switch (action) {
    case 'GEOCODE':
    case 'REVERSE_GEOCODE':
      limit = CONFIG.RATE_LIMITS.GEOCODING;
      break;
    case 'SEARCH_PLACES':
      limit = CONFIG.RATE_LIMITS.PLACES;
      break;
    case 'GET_ROUTE':
      limit = CONFIG.RATE_LIMITS.ROUTING;
      break;
    default:
      limit = 10;
  }
  
  if (!current) {
    return { remaining: limit, resetTime: Date.now() + 60 * 60 * 1000 };
  }
  
  return {
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime,
  };
}

async function yandexGeocodingHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Yandex Maps request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(geocodingSchema, body);
  
  // Check rate limits
  if (!checkRateLimit(userId, data.action)) {
    const rateLimitInfo = getRateLimitInfo(userId, data.action);
    logger.warn('Rate limit exceeded', { 
      userId, 
      action: data.action, 
      resetTime: new Date(rateLimitInfo.resetTime).toISOString() 
    });
    
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
        'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString(),
      },
      body: JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for ${data.action}. Try again after ${new Date(rateLimitInfo.resetTime).toISOString()}`,
          resetTime: rateLimitInfo.resetTime,
          remaining: rateLimitInfo.remaining,
        }
      })
    };
  }
  
  const locationRepository = new LocationRepository();
  const cacheService = new CacheService();
  
  try {
    let result: APIGatewayProxyResult;
    
    switch (data.action) {
      case 'GEOCODE':
        result = await geocodeAddress(data, locationRepository, cacheService, userId);
        break;
      case 'REVERSE_GEOCODE':
        result = await reverseGeocode(data, locationRepository, cacheService, userId);
        break;
      case 'SEARCH_PLACES':
        result = await searchPlaces(data, locationRepository, cacheService, userId);
        break;
      case 'GET_ROUTE':
        result = await getRoute(data, locationRepository, cacheService, userId);
        break;
      case 'CALCULATE_DISTANCE':
        result = await calculateDistance(data, locationRepository, userId);
        break;
      default:
        result = badRequest('Invalid action');
    }
    
    // Add rate limit headers to successful responses
    const rateLimitInfo = getRateLimitInfo(userId, data.action);
    if (result.headers) {
      result.headers['X-RateLimit-Remaining'] = rateLimitInfo.remaining.toString();
      result.headers['X-RateLimit-Reset'] = rateLimitInfo.resetTime.toString();
    } else {
      result.headers = {
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
      };
    }
    
    return result;
  } catch (error) {
    logger.error('Yandex Maps request failed', { userId, action: data.action, error });
    throw error;
  }
}

async function geocodeAddress(
  data: any,
  locationRepository: LocationRepository,
  cacheService: CacheService,
  userId: string
): Promise<APIGatewayProxyResult> {
  if (!data.address) {
    return badRequest('Address is required for geocoding');
  }
  
  const cacheKey = `geocode:${data.address}:${data.searchOptions?.language || 'ru'}`;
  
  try {
    // Check memory cache first for faster response
    if (data.cacheResults) {
      const memoryCache = await cacheService.get(cacheKey);
      if (memoryCache) {
        logger.info('Geocoding result from memory cache', { userId, address: data.address });
        return success({
          results: memoryCache,
          cached: true,
          source: 'memory-cache',
        });
      }

      // Check DynamoDB cache
      const cached = await locationRepository.getGeocodingCache('GEOCODE', cacheKey);
      if (cached) {
        // Store in memory cache for faster future access
        await cacheService.set(cacheKey, cached.results, 3600); // 1 hour in memory
        
        logger.info('Geocoding result from DynamoDB cache', { userId, address: data.address });
        return success({
          results: cached.results,
          cached: true,
          source: 'db-cache',
        });
      }
    }
    
    // Call Yandex Maps API with retry logic
    const results = await callYandexGeocodingAPIWithRetry(data.address, {
      language: data.searchOptions?.language || 'ru',
      limit: data.searchOptions?.limit || 10,
    });
    
    // Cache results in both memory and DynamoDB
    if (data.cacheResults && results.length > 0) {
      // Store in memory cache for fast access
      await cacheService.set(cacheKey, results, 3600); // 1 hour in memory
      
      // Store in DynamoDB for persistence
      await locationRepository.setGeocodingCache({
        id: uuidv4(),
        type: 'GEOCODE',
        address: cacheKey,
        results,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    
    // Log usage for analytics
    await locationRepository.createMapsUsage({
      id: uuidv4(),
      userId,
      action: 'GEOCODE',
      query: data.address,
      resultsCount: results.length,
      createdAt: new Date().toISOString(),
    });
    
    logger.info('Address geocoded successfully', { 
      userId, 
      address: data.address,
      resultsCount: results.length 
    });
    
    return success({
      results,
      cached: false,
      source: 'yandex',
      query: data.address,
    });
  } catch (error) {
    logger.error('Geocoding failed', { userId, address: data.address, error });
    return serverError('Geocoding service temporarily unavailable');
  }
}

async function reverseGeocode(
  data: any,
  locationRepository: LocationRepository,
  cacheService: CacheService,
  userId: string
): Promise<APIGatewayProxyResult> {
  if (!data.coordinates) {
    return badRequest('Coordinates are required for reverse geocoding');
  }
  
  const { latitude, longitude } = data.coordinates;
  const coordsKey = `reverse:${latitude.toFixed(6)},${longitude.toFixed(6)}:${data.searchOptions?.language || 'ru'}`;
  
  try {
    // Check memory cache first
    if (data.cacheResults) {
      const memoryCache = await cacheService.get(coordsKey);
      if (memoryCache) {
        logger.info('Reverse geocoding result from memory cache', { userId, coordinates: coordsKey });
        return success({
          results: memoryCache,
          cached: true,
          source: 'memory-cache',
        });
      }

      // Check DynamoDB cache
      const cached = await locationRepository.getGeocodingCache('REVERSE_GEOCODE', coordsKey);
      if (cached) {
        // Store in memory cache
        await cacheService.set(coordsKey, cached.results, CONFIG.CACHE_TTL.MEMORY.GEOCODING);
        
        logger.info('Reverse geocoding result from DynamoDB cache', { userId, coordinates: coordsKey });
        return success({
          results: cached.results,
          cached: true,
          source: 'db-cache',
        });
      }
    }
    
    // Call Yandex Maps API with retry
    const results = await callYandexReverseGeocodingAPIWithRetry(latitude, longitude, {
      language: data.searchOptions?.language || 'ru',
    });
    
    // Cache results in both memory and DynamoDB
    if (data.cacheResults && results.length > 0) {
      // Store in memory cache
      await cacheService.set(coordsKey, results, CONFIG.CACHE_TTL.MEMORY.GEOCODING);
      
      // Store in DynamoDB
      await locationRepository.setGeocodingCache({
        id: uuidv4(),
        type: 'REVERSE_GEOCODE',
        coordinates: coordsKey,
        results,
        userId,
        expiresAt: new Date(Date.now() + CONFIG.CACHE_TTL.DB.GEOCODING * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    
    // Log usage
    await locationRepository.createMapsUsage({
      id: uuidv4(),
      userId,
      action: 'REVERSE_GEOCODE',
      coordinates: coordsKey,
      resultsCount: results.length,
      createdAt: new Date().toISOString(),
    });
    
    logger.info('Coordinates reverse geocoded successfully', { 
      userId, 
      coordinates: coordsKey,
      resultsCount: results.length 
    });
    
    return success({
      results,
      cached: false,
      source: 'yandex',
      coordinates: data.coordinates,
    });
  } catch (error) {
    logger.error('Reverse geocoding failed', { userId, coordinates: coordsKey, error });
    return serverError('Reverse geocoding service temporarily unavailable');
  }
}

async function searchPlaces(
  data: any,
  locationRepository: LocationRepository,
  cacheService: CacheService,
  userId: string
): Promise<APIGatewayProxyResult> {
  if (!data.query) {
    return badRequest('Query is required for place search');
  }
  
  const searchKey = `places:${data.query}_${data.coordinates ? `${data.coordinates.latitude},${data.coordinates.longitude}` : 'global'}_${data.searchOptions?.radius || 5000}_${data.searchOptions?.language || 'ru'}`;
  
  try {
    // Check memory cache first
    if (data.cacheResults) {
      const memoryCache = await cacheService.get(searchKey);
      if (memoryCache) {
        logger.info('Place search result from memory cache', { userId, query: data.query });
        return success({
          results: memoryCache,
          cached: true,
          source: 'memory-cache',
        });
      }

      // Check DynamoDB cache
      const cached = await locationRepository.getGeocodingCache('SEARCH_PLACES', searchKey, CONFIG.CACHE_TTL.DB.PLACES * 1000);
      if (cached) {
        // Store in memory cache
        await cacheService.set(searchKey, cached.results, CONFIG.CACHE_TTL.MEMORY.PLACES);
        
        logger.info('Place search result from DynamoDB cache', { userId, query: data.query });
        return success({
          results: cached.results,
          cached: true,
          source: 'db-cache',
        });
      }
    }
    
    // Call Yandex Maps API with retry
    const results = await callYandexPlacesAPIWithRetry(data.query, {
      coordinates: data.coordinates,
      category: data.searchOptions?.category,
      radius: data.searchOptions?.radius || 5000,
      limit: data.searchOptions?.limit || 10,
      language: data.searchOptions?.language || 'ru',
    });
    
    // Cache results in both memory and DynamoDB
    if (data.cacheResults && results.length > 0) {
      // Store in memory cache
      await cacheService.set(searchKey, results, CONFIG.CACHE_TTL.MEMORY.PLACES);
      
      // Store in DynamoDB
      await locationRepository.setGeocodingCache({
        id: uuidv4(),
        type: 'SEARCH_PLACES',
        query: searchKey,
        results,
        userId,
        expiresAt: new Date(Date.now() + CONFIG.CACHE_TTL.DB.PLACES * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    
    // Log usage
    await locationRepository.createMapsUsage({
      id: uuidv4(),
      userId,
      action: 'SEARCH_PLACES',
      query: data.query,
      coordinates: data.coordinates ? `${data.coordinates.latitude},${data.coordinates.longitude}` : undefined,
      resultsCount: results.length,
      createdAt: new Date().toISOString(),
    });
    
    logger.info('Places searched successfully', { 
      userId, 
      query: data.query,
      resultsCount: results.length 
    });
    
    return success({
      results,
      cached: false,
      source: 'yandex',
      query: data.query,
      searchArea: data.coordinates,
    });
  } catch (error) {
    logger.error('Place search failed', { userId, query: data.query, error });
    return serverError('Place search service temporarily unavailable');
  }
}

async function getRoute(
  data: any,
  locationRepository: LocationRepository,
  cacheService: CacheService,
  userId: string
): Promise<APIGatewayProxyResult> {
  if (!data.origin || !data.destination) {
    return badRequest('Origin and destination coordinates are required for routing');
  }
  
  const routeKey = `route:${data.origin.latitude},${data.origin.longitude}_${data.destination.latitude},${data.destination.longitude}_${data.routeOptions?.mode || 'driving'}`;
  
  try {
    // Check memory cache first
    if (data.cacheResults) {
      const memoryCache = await cacheService.get(routeKey);
      if (memoryCache) {
        logger.info('Route result from memory cache', { userId, routeKey });
        return success({
          route: memoryCache,
          cached: true,
          source: 'memory-cache',
        });
      }

      // Check DynamoDB cache
      const cached = await locationRepository.getGeocodingCache('GET_ROUTE', routeKey, CONFIG.CACHE_TTL.DB.ROUTING * 1000);
      if (cached) {
        // Store in memory cache
        await cacheService.set(routeKey, cached.results, CONFIG.CACHE_TTL.MEMORY.ROUTING);
        
        logger.info('Route result from DynamoDB cache', { userId, routeKey });
        return success({
          route: cached.results,
          cached: true,
          source: 'db-cache',
        });
      }
    }
    
    // Call Yandex Maps API with retry
    const route = await callYandexRoutingAPIWithRetry(
      data.origin,
      data.destination,
      {
        waypoints: data.waypoints,
        mode: data.routeOptions?.mode || 'driving',
        avoidTolls: data.routeOptions?.avoidTolls || false,
        avoidHighways: data.routeOptions?.avoidHighways || false,
        avoidFerries: data.routeOptions?.avoidFerries || false,
        optimize: data.routeOptions?.optimize || true,
      }
    );
    
    // Cache results in both memory and DynamoDB
    if (data.cacheResults && route) {
      // Store in memory cache
      await cacheService.set(routeKey, route, CONFIG.CACHE_TTL.MEMORY.ROUTING);
      
      // Store in DynamoDB
      await locationRepository.setGeocodingCache({
        id: uuidv4(),
        type: 'GET_ROUTE',
        query: routeKey,
        results: route,
        userId,
        expiresAt: new Date(Date.now() + CONFIG.CACHE_TTL.DB.ROUTING * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    
    // Log usage
    await locationRepository.createMapsUsage({
      id: uuidv4(),
      userId,
      action: 'GET_ROUTE',
      query: routeKey,
      resultsCount: route ? 1 : 0,
      createdAt: new Date().toISOString(),
    });
    
    logger.info('Route calculated successfully', { 
      userId, 
      distance: route?.distance,
      duration: route?.duration 
    });
    
    return success({
      route,
      cached: false,
      source: 'yandex',
      origin: data.origin,
      destination: data.destination,
    });
  } catch (error) {
    logger.error('Route calculation failed', { userId, routeKey, error });
    return serverError('Routing service temporarily unavailable');
  }
}

async function calculateDistance(
  data: any,
  locationRepository: LocationRepository,
  userId: string
): Promise<APIGatewayProxyResult> {
  if (!data.origin || !data.destination) {
    return badRequest('Origin and destination coordinates are required for distance calculation');
  }
  
  try {
    // Calculate straight-line distance
    const straightDistance = calculateStraightDistance(
      data.origin,
      data.destination
    );
    
    // Get route for accurate distance if requested
    let routeDistance = null;
    let routeDuration = null;
    
    if (data.routeOptions?.mode) {
      try {
        const route = await callYandexRoutingAPIWithRetry(
          data.origin,
          data.destination,
          {
            mode: data.routeOptions.mode,
            optimize: true,
          }
        );
        
        if (route) {
          routeDistance = route.distance;
          routeDuration = route.duration;
        }
      } catch (error) {
        logger.warn('Failed to get route distance, using straight distance', { userId, error });
      }
    }
    
    // Log usage
    await locationRepository.createMapsUsage({
      id: uuidv4(),
      userId,
      action: 'CALCULATE_DISTANCE',
      query: `${data.origin.latitude},${data.origin.longitude}_${data.destination.latitude},${data.destination.longitude}`,
      resultsCount: 1,
      createdAt: new Date().toISOString(),
    });
    
    logger.info('Distance calculated successfully', { 
      userId, 
      straightDistance,
      routeDistance 
    });
    
    return success({
      straightDistance: {
        meters: straightDistance,
        kilometers: Math.round(straightDistance / 1000 * 100) / 100,
        miles: Math.round(straightDistance / 1609.34 * 100) / 100,
      },
      routeDistance: routeDistance ? {
        meters: routeDistance,
        kilometers: Math.round(routeDistance / 1000 * 100) / 100,
        miles: Math.round(routeDistance / 1609.34 * 100) / 100,
      } : null,
      routeDuration: routeDuration ? {
        seconds: routeDuration,
        minutes: Math.round(routeDuration / 60),
        hours: Math.round(routeDuration / 3600 * 100) / 100,
      } : null,
      origin: data.origin,
      destination: data.destination,
    });
  } catch (error) {
    logger.error('Distance calculation failed', { userId, error });
    return serverError('Distance calculation service temporarily unavailable');
  }
}

// Retry utility function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = CONFIG.YANDEX_API.RETRY.MAX_ATTEMPTS,
  initialDelay: number = CONFIG.YANDEX_API.RETRY.INITIAL_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400') || 
          error instanceof Error && error.message.includes('401') ||
          error instanceof Error && error.message.includes('403') ||
          error instanceof Error && error.message.includes('404')) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
      logger.warn(`API call failed, retrying in ${delay}ms`, { attempt, maxAttempts, error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Yandex Maps API integration functions with retry logic
async function callYandexGeocodingAPIWithRetry(address: string, options: any): Promise<any[]> {
  return retryWithBackoff(() => callYandexGeocodingAPI(address, options));
}

async function callYandexReverseGeocodingAPIWithRetry(latitude: number, longitude: number, options: any): Promise<any[]> {
  return retryWithBackoff(() => callYandexReverseGeocodingAPI(latitude, longitude, options));
}

async function callYandexPlacesAPIWithRetry(query: string, options: any): Promise<any[]> {
  return retryWithBackoff(() => callYandexPlacesAPI(query, options));
}

async function callYandexRoutingAPIWithRetry(origin: any, destination: any, options: any): Promise<any> {
  return retryWithBackoff(() => callYandexRoutingAPI(origin, destination, options));
}

async function callYandexGeocodingAPI(address: string, options: any): Promise<any[]> {
  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Yandex Maps API key not configured');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    geocode: address,
    format: 'json',
    lang: options.language || 'ru_RU',
    results: String(options.limit || 10),
  });

  const response = await axios.get(`${CONFIG.YANDEX_API.GEOCODING_URL}?${params}`, {
    timeout: CONFIG.YANDEX_API.TIMEOUT.GEOCODING,
    headers: {
      'User-Agent': 'HandShakeMeService/1.0',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Yandex Geocoding API error: ${response.status}`);
  }

  const data = response.data;
  
  // Check for API errors in response
  if (data.error) {
    throw new Error(`Yandex API error: ${data.error.message || 'Unknown error'}`);
  }

  const geoObjects = data?.response?.GeoObjectCollection?.featureMember || [];

  return geoObjects.map((item: any) => {
    const geoObject = item.GeoObject;
    const coords = geoObject.Point.pos.split(' ').map(Number);
    
    return {
      address: geoObject.metaDataProperty.GeocoderMetaData.text,
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
      precision: geoObject.metaDataProperty.GeocoderMetaData.precision,
      kind: geoObject.metaDataProperty.GeocoderMetaData.kind,
      components: geoObject.metaDataProperty.GeocoderMetaData.Address?.Components || [],
    };
  });
}

async function callYandexReverseGeocodingAPI(latitude: number, longitude: number, options: any): Promise<any[]> {
  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Yandex Maps API key not configured');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    geocode: `${longitude},${latitude}`,
    format: 'json',
    lang: options.language || 'ru_RU',
    kind: 'house',
  });

  const response = await axios.get(`${CONFIG.YANDEX_API.GEOCODING_URL}?${params}`, {
    timeout: CONFIG.YANDEX_API.TIMEOUT.GEOCODING,
    headers: {
      'User-Agent': 'HandShakeMeService/1.0',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Yandex Reverse Geocoding API error: ${response.status}`);
  }

  const data = response.data;
  
  // Check for API errors in response
  if (data.error) {
    throw new Error(`Yandex API error: ${data.error.message || 'Unknown error'}`);
  }

  const geoObjects = data?.response?.GeoObjectCollection?.featureMember || [];

  return geoObjects.map((item: any) => {
    const geoObject = item.GeoObject;
    const coords = geoObject.Point.pos.split(' ').map(Number);
    
    return {
      address: geoObject.metaDataProperty.GeocoderMetaData.text,
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
      precision: geoObject.metaDataProperty.GeocoderMetaData.precision,
      kind: geoObject.metaDataProperty.GeocoderMetaData.kind,
      components: geoObject.metaDataProperty.GeocoderMetaData.Address?.Components || [],
    };
  });
}

async function callYandexPlacesAPI(query: string, options: any): Promise<any[]> {
  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Yandex Maps API key not configured');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    text: query,
    lang: options.language || 'ru_RU',
    results: String(options.limit || 10),
  });

  if (options.coordinates) {
    params.append('ll', `${options.coordinates.longitude},${options.coordinates.latitude}`);
    params.append('spn', '0.1,0.1');
  }

  const response = await axios.get(`${CONFIG.YANDEX_API.PLACES_URL}?${params}`, {
    timeout: CONFIG.YANDEX_API.TIMEOUT.PLACES,
    headers: {
      'User-Agent': 'HandShakeMeService/1.0',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Yandex Places API error: ${response.status}`);
  }

  const data = response.data;
  
  // Check for API errors in response
  if (data.error) {
    throw new Error(`Yandex API error: ${data.error.message || 'Unknown error'}`);
  }

  const features = data?.features || [];

  return features.map((feature: any) => {
    const coords = feature.geometry.coordinates;
    
    return {
      name: feature.properties.name,
      description: feature.properties.description,
      address: feature.properties.CompanyMetaData?.address,
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
      category: feature.properties.CompanyMetaData?.Categories?.[0]?.name,
      phone: feature.properties.CompanyMetaData?.Phones?.[0]?.formatted,
      website: feature.properties.CompanyMetaData?.url,
      hours: feature.properties.CompanyMetaData?.Hours?.text,
    };
  });
}

async function callYandexRoutingAPI(origin: any, destination: any, options: any): Promise<any> {
  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Yandex Maps API key not configured');
  }

  const waypoints = [
    `${origin.longitude},${origin.latitude}`,
    ...(options.waypoints || []).map((wp: any) => `${wp.longitude},${wp.latitude}`),
    `${destination.longitude},${destination.latitude}`,
  ];

  const params = new URLSearchParams({
    apikey: apiKey,
    waypoints: waypoints.join('|'),
    mode: options.mode || 'driving',
  });

  if (options.avoidTolls) params.append('avoid', 'tolls');
  if (options.avoidHighways) params.append('avoid', 'highways');
  if (options.avoidFerries) params.append('avoid', 'ferries');

  const response = await axios.get(`${CONFIG.YANDEX_API.ROUTING_URL}?${params}`, {
    timeout: CONFIG.YANDEX_API.TIMEOUT.ROUTING,
    headers: {
      'User-Agent': 'HandShakeMeService/1.0',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Yandex Routing API error: ${response.status}`);
  }

  const data = response.data;
  
  // Check for API errors in response
  if (data.error) {
    throw new Error(`Yandex API error: ${data.error.message || 'Unknown error'}`);
  }

  const route = data?.route;

  if (!route) {
    return null;
  }

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.legs?.[0]?.steps?.map((step: any) => ({
      coordinates: step.polyline?.coordinates || [],
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
    })) || [],
    bounds: route.bbox,
  };
}

function calculateStraightDistance(origin: any, destination: any): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (origin.latitude * Math.PI) / 180;
  const lat2Rad = (destination.latitude * Math.PI) / 180;
  const deltaLatRad = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const deltaLonRad = ((destination.longitude - origin.longitude) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(yandexGeocodingHandler)
  )
);

// Export functions for testing
export {
  checkRateLimit,
  getRateLimitInfo,
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  getRoute,
  calculateDistance,
  callYandexGeocodingAPI,
  callYandexGeocodingAPIWithRetry,
  callYandexReverseGeocodingAPI,
  callYandexReverseGeocodingAPIWithRetry,
  callYandexPlacesAPI,
  callYandexPlacesAPIWithRetry,
  callYandexRoutingAPI,
  callYandexRoutingAPIWithRetry,
  calculateStraightDistance,
  retryWithBackoff,
  CONFIG,
  rateLimitCache
};