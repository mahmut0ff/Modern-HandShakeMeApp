import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  useGeocodeAddressMutation,
  useReverseGeocodeMutation,
  useCalculateDistanceMutation,
} from '../services/yandexMapsApi';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  address: string;
  coordinates: LocationCoordinates;
  components?: {
    country?: string;
    region?: string;
    city?: string;
    street?: string;
    house?: string;
  };
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [geocodeAddress] = useGeocodeAddressMutation();
  const [reverseGeocode] = useReverseGeocodeMutation();
  const [calculateDistance] = useCalculateDistanceMutation();

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      setLocationError('Не удалось запросить разрешение на геолокацию');
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Необходимо разрешение на доступ к геолокации');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coordinates);
      return coordinates;
    } catch (error: any) {
      setLocationError(error.message || 'Не удалось определить местоположение');
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [requestPermissions]);

  /**
   * Watch location changes
   */
  const watchLocation = useCallback(
    async (callback: (location: LocationCoordinates) => void) => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 100, // 100 meters
        },
        (location) => {
          const coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(coordinates);
          callback(coordinates);
        }
      );

      return subscription;
    },
    [requestPermissions]
  );

  /**
   * Geocode address to coordinates
   */
  const geocode = useCallback(
    async (address: string): Promise<LocationAddress[]> => {
      try {
        const result = await geocodeAddress({
          action: 'GEOCODE',
          address,
          searchOptions: {
            language: 'ru',
            limit: 5,
          },
          cacheResults: true,
        }).unwrap();

        return result.results.map((r) => ({
          address: r.address,
          coordinates: r.coordinates,
          components: r.components,
        }));
      } catch (error: any) {
        throw new Error(error.message || 'Не удалось найти адрес');
      }
    },
    [geocodeAddress]
  );

  /**
   * Reverse geocode coordinates to address
   */
  const reverseGeocodeFn = useCallback(
    async (coordinates: LocationCoordinates): Promise<LocationAddress | null> => {
      try {
        const result = await reverseGeocode({
          action: 'REVERSE_GEOCODE',
          coordinates,
          searchOptions: {
            language: 'ru',
          },
          cacheResults: true,
        }).unwrap();

        if (result.results.length === 0) {
          return null;
        }

        const first = result.results[0];
        return {
          address: first.address,
          coordinates: first.coordinates,
          components: first.components,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Не удалось определить адрес');
      }
    },
    [reverseGeocode]
  );

  /**
   * Calculate distance between two points
   */
  const getDistance = useCallback(
    async (
      origin: LocationCoordinates,
      destination: LocationCoordinates,
      mode?: 'driving' | 'walking' | 'transit' | 'bicycle'
    ) => {
      try {
        const result = await calculateDistance({
          action: 'CALCULATE_DISTANCE',
          origin,
          destination,
          routeOptions: mode ? { mode } : undefined,
        }).unwrap();

        return result;
      } catch (error: any) {
        throw new Error(error.message || 'Не удалось рассчитать расстояние');
      }
    },
    [calculateDistance]
  );

  /**
   * Calculate straight-line distance (Haversine formula)
   */
  const getStraightDistance = useCallback(
    (origin: LocationCoordinates, destination: LocationCoordinates): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
      const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origin.latitude * Math.PI) / 180) *
          Math.cos((destination.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Auto-load current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    currentLocation,
    locationError,
    isLoadingLocation,
    hasPermission,
    requestPermissions,
    getCurrentLocation,
    watchLocation,
    geocode,
    reverseGeocode: reverseGeocodeFn,
    getDistance,
    getStraightDistance,
  };
};
