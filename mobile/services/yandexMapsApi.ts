import { api } from './api';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  components: {
    country?: string;
    region?: string;
    city?: string;
    district?: string;
    street?: string;
    house?: string;
    postalCode?: string;
  };
  precision: 'exact' | 'number' | 'near' | 'range' | 'street' | 'other';
  type: 'house' | 'street' | 'metro' | 'district' | 'locality' | 'area' | 'province' | 'country' | 'other';
}

export interface PlaceResult {
  name: string;
  address: string;
  coordinates: Coordinates;
  category: string;
  rating?: number;
  reviews?: number;
  phone?: string;
  website?: string;
  workingHours?: {
    [key: string]: string;
  };
  photos?: string[];
  distance?: number;
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: Coordinates[];
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    coordinates: Coordinates[];
  }>;
  traffic?: {
    level: 'unknown' | 'free' | 'light' | 'medium' | 'heavy' | 'blocked';
    duration: number;
  };
}

export interface DistanceResult {
  straightDistance: {
    meters: number;
    kilometers: number;
    miles: number;
  };
  routeDistance?: {
    meters: number;
    kilometers: number;
    miles: number;
  };
  routeDuration?: {
    seconds: number;
    minutes: number;
    hours: number;
  };
  origin: Coordinates;
  destination: Coordinates;
}

export interface GeocodeRequest {
  action: 'GEOCODE';
  address: string;
  searchOptions?: {
    language?: 'ru' | 'en' | 'tr' | 'uk';
    limit?: number;
  };
  cacheResults?: boolean;
}

export interface ReverseGeocodeRequest {
  action: 'REVERSE_GEOCODE';
  coordinates: Coordinates;
  searchOptions?: {
    language?: 'ru' | 'en' | 'tr' | 'uk';
  };
  cacheResults?: boolean;
}

export interface SearchPlacesRequest {
  action: 'SEARCH_PLACES';
  query: string;
  coordinates?: Coordinates;
  searchOptions?: {
    category?: string;
    radius?: number;
    limit?: number;
    language?: 'ru' | 'en' | 'tr' | 'uk';
  };
  cacheResults?: boolean;
}

export interface GetRouteRequest {
  action: 'GET_ROUTE';
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  routeOptions?: {
    mode?: 'driving' | 'walking' | 'transit' | 'bicycle';
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
    optimize?: boolean;
  };
  cacheResults?: boolean;
}

export interface CalculateDistanceRequest {
  action: 'CALCULATE_DISTANCE';
  origin: Coordinates;
  destination: Coordinates;
  routeOptions?: {
    mode?: 'driving' | 'walking' | 'transit' | 'bicycle';
  };
}

export const yandexMapsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Geocode address to coordinates
    geocodeAddress: builder.mutation<{
      results: GeocodingResult[];
      cached: boolean;
      source: 'cache' | 'yandex';
      query: string;
    }, GeocodeRequest>({
      query: (data) => ({
        url: '/maps/yandex-geocoding',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maps'],
    }),

    // Reverse geocode coordinates to address
    reverseGeocode: builder.mutation<{
      results: GeocodingResult[];
      cached: boolean;
      source: 'cache' | 'yandex';
      coordinates: Coordinates;
    }, ReverseGeocodeRequest>({
      query: (data) => ({
        url: '/maps/yandex-geocoding',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maps'],
    }),

    // Search for places
    searchPlaces: builder.mutation<{
      results: PlaceResult[];
      cached: boolean;
      source: 'cache' | 'yandex';
      query: string;
      searchArea?: Coordinates;
    }, SearchPlacesRequest>({
      query: (data) => ({
        url: '/maps/yandex-geocoding',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maps'],
    }),

    // Get route between points
    getRoute: builder.mutation<{
      route: RouteResult;
      cached: boolean;
      source: 'cache' | 'yandex';
      origin: Coordinates;
      destination: Coordinates;
    }, GetRouteRequest>({
      query: (data) => ({
        url: '/maps/yandex-geocoding',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maps'],
    }),

    // Calculate distance between points
    calculateDistance: builder.mutation<DistanceResult, CalculateDistanceRequest>({
      query: (data) => ({
        url: '/maps/yandex-geocoding',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maps'],
    }),

    // Get nearby masters with location
    getNearbyMasters: builder.query<{
      masters: Array<{
        id: string;
        name: string;
        avatar?: string;
        rating: number;
        reviewCount: number;
        services: string[];
        coordinates: Coordinates;
        address: string;
        distance: number;
        isOnline: boolean;
        responseTime: number;
        pricing: {
          minPrice: number;
          maxPrice: number;
          currency: string;
        };
      }>;
      totalCount: number;
      searchCenter: Coordinates;
      searchRadius: number;
    }, {
      coordinates: Coordinates;
      radius?: number;
      serviceCategory?: string;
      limit?: number;
      sortBy?: 'distance' | 'rating' | 'price' | 'response_time';
    }>({
      query: (params) => ({
        url: '/location/nearby-masters',
        params,
      }),
      providesTags: ['Location', 'Masters'],
    }),

    // Get maps usage statistics
    getMapsUsageStats: builder.query<{
      totalRequests: number;
      requestsByType: {
        geocode: number;
        reverseGeocode: number;
        searchPlaces: number;
        getRoute: number;
        calculateDistance: number;
      };
      cacheHitRate: number;
      averageResponseTime: number;
      topSearches: Array<{
        query: string;
        count: number;
      }>;
      usageByDay: Array<{
        date: string;
        requests: number;
      }>;
    }, {
      period?: 'day' | 'week' | 'month' | 'year';
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/maps/usage-stats',
        params,
      }),
      providesTags: ['Maps'],
    }),
  }),
});

export const {
  useGeocodeAddressMutation,
  useReverseGeocodeMutation,
  useSearchPlacesMutation,
  useGetRouteMutation,
  useCalculateDistanceMutation,
  useGetNearbyMastersQuery,
  useGetMapsUsageStatsQuery,
} = yandexMapsApi;