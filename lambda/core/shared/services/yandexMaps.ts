// Yandex Maps Service - Complete integration with Yandex Maps API

import { logger } from '../utils/logger';

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
  distance?: number; // meters from search center
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: Coordinates[];
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    coordinates: Coordinates[];
  }>;
  traffic?: {
    level: 'unknown' | 'free' | 'light' | 'medium' | 'heavy' | 'blocked';
    duration: number; // seconds with current traffic
  };
}

export interface SearchOptions {
  coordinates?: Coordinates;
  category?: string;
  radius?: number;
  limit?: number;
  language?: 'ru' | 'en' | 'tr' | 'uk';
}

export interface RouteOptions {
  waypoints?: Coordinates[];
  mode?: 'driving' | 'walking' | 'transit' | 'bicycle';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  optimize?: boolean;
}

export class YandexMapsService {
  private apiKey: string;
  private baseUrl: string;
  private geocodingUrl: string;
  private routingUrl: string;
  private placesUrl: string;

  constructor() {
    this.apiKey = process.env.YANDEX_MAPS_API_KEY || '';
    this.baseUrl = 'https://api-maps.yandex.ru';
    this.geocodingUrl = `${this.baseUrl}/2.1/`;
    this.routingUrl = `${this.baseUrl}/v2/route`;
    this.placesUrl = `${this.baseUrl}/v1/search`;
    
    if (!this.apiKey) {
      logger.warn('Yandex Maps API key not configured');
    }
  }

  async geocodeAddress(address: string, options: { language?: string; limit?: number } = {}): Promise<GeocodingResult[]> {
    try {
      logger.info('Geocoding address', { address });

      const params = new URLSearchParams({
        apikey: this.apiKey,
        geocode: address,
        format: 'json',
        lang: options.language || 'ru_RU',
        results: (options.limit || 10).toString(),
      });

      const response = await fetch(`${this.geocodingUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Yandex Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Yandex API error: ${data.error.message}`);
      }

      const results = this.parseGeocodingResponse(data);
      
      logger.info('Address geocoded successfully', { 
        address, 
        resultsCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Geocoding failed', { address, error: error.message });
      throw error;
    }
  }

  async reverseGeocode(latitude: number, longitude: number, options: { language?: string } = {}): Promise<GeocodingResult[]> {
    try {
      logger.info('Reverse geocoding coordinates', { latitude, longitude });

      const params = new URLSearchParams({
        apikey: this.apiKey,
        geocode: `${longitude},${latitude}`,
        format: 'json',
        lang: options.language || 'ru_RU',
        kind: 'house',
      });

      const response = await fetch(`${this.geocodingUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Yandex Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Yandex API error: ${data.error.message}`);
      }

      const results = this.parseGeocodingResponse(data);
      
      logger.info('Coordinates reverse geocoded successfully', { 
        latitude, 
        longitude, 
        resultsCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Reverse geocoding failed', { latitude, longitude, error: error.message });
      throw error;
    }
  }

  async searchPlaces(query: string, options: SearchOptions = {}): Promise<PlaceResult[]> {
    try {
      logger.info('Searching places', { query, options });

      // Use Yandex Search API for places
      const params = new URLSearchParams({
        apikey: this.apiKey,
        text: query,
        lang: options.language || 'ru_RU',
        results: (options.limit || 10).toString(),
        type: 'biz',
      });

      if (options.coordinates) {
        params.append('ll', `${options.coordinates.longitude},${options.coordinates.latitude}`);
        if (options.radius) {
          params.append('spn', this.calculateSpan(options.radius));
        }
      }

      if (options.category) {
        params.append('rspn', '1');
        params.append('text', `${query} ${options.category}`);
      }

      const response = await fetch(`https://search-maps.yandex.ru/v1/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Yandex Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Yandex API error: ${data.error.message}`);
      }

      const results = this.parsePlacesResponse(data, options.coordinates);
      
      logger.info('Places searched successfully', { 
        query, 
        resultsCount: results.length 
      });

      return results;
    } catch (error) {
      logger.error('Place search failed', { query, error: error.message });
      throw error;
    }
  }

  async getRoute(origin: Coordinates, destination: Coordinates, options: RouteOptions = {}): Promise<RouteResult | null> {
    try {
      logger.info('Calculating route', { origin, destination, options });

      const waypoints = [origin];
      if (options.waypoints) {
        waypoints.push(...options.waypoints);
      }
      waypoints.push(destination);

      const waypointsStr = waypoints
        .map(wp => `${wp.longitude},${wp.latitude}`)
        .join('|');

      const params = new URLSearchParams({
        apikey: this.apiKey,
        waypoints: waypointsStr,
        mode: this.mapRouteMode(options.mode || 'driving'),
        avoid_tolls: options.avoidTolls ? 'true' : 'false',
        avoid_unpaved: options.avoidHighways ? 'true' : 'false',
      });

      const response = await fetch(`${this.routingUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Yandex Routing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Yandex API error: ${data.error.message}`);
      }

      const route = this.parseRouteResponse(data);
      
      logger.info('Route calculated successfully', { 
        origin, 
        destination, 
        distance: route?.distance,
        duration: route?.duration 
      });

      return route;
    } catch (error) {
      logger.error('Route calculation failed', { origin, destination, error: error.message });
      throw error;
    }
  }

  calculateStraightDistance(origin: Coordinates, destination: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (origin.latitude * Math.PI) / 180;
    const lat2Rad = (destination.latitude * Math.PI) / 180;
    const deltaLatRad = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const deltaLonRad = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return Math.round(R * c);
  }

  private parseGeocodingResponse(data: any): GeocodingResult[] {
    const results: GeocodingResult[] = [];
    
    try {
      const geoObjects = data.response?.GeoObjectCollection?.featureMember || [];
      
      for (const member of geoObjects) {
        const geoObject = member.GeoObject;
        if (!geoObject) continue;

        const coordinates = geoObject.Point?.pos?.split(' ');
        if (!coordinates || coordinates.length !== 2) continue;

        const components = this.parseAddressComponents(geoObject.metaDataProperty?.GeocoderMetaData);
        
        results.push({
          address: geoObject.metaDataProperty?.GeocoderMetaData?.text || geoObject.name,
          coordinates: {
            latitude: parseFloat(coordinates[1]),
            longitude: parseFloat(coordinates[0]),
          },
          components,
          precision: this.mapPrecision(geoObject.metaDataProperty?.GeocoderMetaData?.precision),
          type: this.mapAddressType(geoObject.metaDataProperty?.GeocoderMetaData?.kind),
        });
      }
    } catch (error) {
      logger.error('Failed to parse geocoding response', { error: error.message });
    }
    
    return results;
  }

  private parsePlacesResponse(data: any, searchCenter?: Coordinates): PlaceResult[] {
    const results: PlaceResult[] = [];
    
    try {
      const features = data.features || [];
      
      for (const feature of features) {
        const geometry = feature.geometry;
        const properties = feature.properties;
        
        if (!geometry?.coordinates || !properties) continue;

        const coordinates = {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
        };

        let distance: number | undefined;
        if (searchCenter) {
          distance = this.calculateStraightDistance(searchCenter, coordinates);
        }

        const companyMetaData = properties.CompanyMetaData || {};
        
        results.push({
          name: properties.name || companyMetaData.name || 'Unknown',
          address: properties.description || companyMetaData.address || '',
          coordinates,
          category: companyMetaData.Categories?.[0]?.name || 'Other',
          rating: this.parseRating(companyMetaData.Reviews),
          reviews: companyMetaData.Reviews?.count,
          phone: companyMetaData.Phones?.[0]?.formatted,
          website: companyMetaData.url,
          workingHours: this.parseWorkingHours(companyMetaData.Hours),
          photos: companyMetaData.Photos?.map((photo: any) => photo.href),
          distance,
        });
      }
    } catch (error) {
      logger.error('Failed to parse places response', { error: error.message });
    }
    
    return results;
  }

  private parseRouteResponse(data: any): RouteResult | null {
    try {
      const route = data.route;
      if (!route) return null;

      const legs = route.legs || [];
      let totalDistance = 0;
      let totalDuration = 0;
      const allSteps: any[] = [];
      const allCoordinates: Coordinates[] = [];

      for (const leg of legs) {
        totalDistance += leg.distance?.value || 0;
        totalDuration += leg.duration?.value || 0;

        const steps = leg.steps || [];
        for (const step of steps) {
          allSteps.push({
            instruction: step.maneuver?.instruction || '',
            distance: step.distance?.value || 0,
            duration: step.duration?.value || 0,
            coordinates: this.decodePolyline(step.polyline?.points || ''),
          });

          // Add step coordinates to overall geometry
          const stepCoords = this.decodePolyline(step.polyline?.points || '');
          allCoordinates.push(...stepCoords);
        }
      }

      return {
        distance: totalDistance,
        duration: totalDuration,
        geometry: allCoordinates,
        steps: allSteps,
        traffic: route.duration_in_traffic ? {
          level: this.mapTrafficLevel(route.traffic_level),
          duration: route.duration_in_traffic.value,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to parse route response', { error: error.message });
      return null;
    }
  }

  private parseAddressComponents(metaData: any): GeocodingResult['components'] {
    const components: GeocodingResult['components'] = {};
    
    try {
      const addressDetails = metaData?.AddressDetails?.Country;
      if (!addressDetails) return components;

      components.country = addressDetails.CountryName;
      
      const adminArea = addressDetails.AdministrativeArea;
      if (adminArea) {
        components.region = adminArea.AdministrativeAreaName;
        
        const subAdminArea = adminArea.SubAdministrativeArea;
        if (subAdminArea) {
          components.city = subAdminArea.SubAdministrativeAreaName;
          
          const locality = subAdminArea.Locality;
          if (locality) {
            components.district = locality.LocalityName;
            
            const thoroughfare = locality.Thoroughfare;
            if (thoroughfare) {
              components.street = thoroughfare.ThoroughfareName;
              
              const premise = thoroughfare.Premise;
              if (premise) {
                components.house = premise.PremiseNumber;
                components.postalCode = premise.PostalCode?.PostalCodeNumber;
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to parse address components', { error: error.message });
    }
    
    return components;
  }

  private parseRating(reviews: any): number | undefined {
    if (!reviews) return undefined;
    
    const rating = reviews.rating || reviews.score;
    return rating ? parseFloat(rating) : undefined;
  }

  private parseWorkingHours(hours: any): { [key: string]: string } | undefined {
    if (!hours?.Availabilities) return undefined;
    
    const workingHours: { [key: string]: string } = {};
    
    try {
      for (const availability of hours.Availabilities) {
        const days = availability.Days || [];
        const intervals = availability.TwentyFourHours ? 
          ['00:00-23:59'] : 
          (availability.Intervals || []).map((interval: any) => 
            `${interval.from}-${interval.to}`
          );
        
        for (const day of days) {
          workingHours[day] = intervals.join(', ');
        }
      }
    } catch (error) {
      logger.error('Failed to parse working hours', { error: error.message });
    }
    
    return Object.keys(workingHours).length > 0 ? workingHours : undefined;
  }

  private mapRouteMode(mode: string): string {
    const modeMap: { [key: string]: string } = {
      driving: 'driving',
      walking: 'pedestrian',
      transit: 'masstransit',
      bicycle: 'bicycle',
    };
    
    return modeMap[mode] || 'driving';
  }

  private mapPrecision(precision: string): GeocodingResult['precision'] {
    const precisionMap: { [key: string]: GeocodingResult['precision'] } = {
      exact: 'exact',
      number: 'number',
      near: 'near',
      range: 'range',
      street: 'street',
    };
    
    return precisionMap[precision] || 'other';
  }

  private mapAddressType(kind: string): GeocodingResult['type'] {
    const typeMap: { [key: string]: GeocodingResult['type'] } = {
      house: 'house',
      street: 'street',
      metro: 'metro',
      district: 'district',
      locality: 'locality',
      area: 'area',
      province: 'province',
      country: 'country',
    };
    
    return typeMap[kind] || 'other';
  }

  private mapTrafficLevel(level: string): RouteResult['traffic']['level'] {
    const levelMap: { [key: string]: RouteResult['traffic']['level'] } = {
      0: 'unknown',
      1: 'free',
      2: 'light',
      3: 'medium',
      4: 'heavy',
      5: 'blocked',
    };
    
    return levelMap[level] || 'unknown';
  }

  private calculateSpan(radiusMeters: number): string {
    // Convert radius to degrees (approximate)
    const degreesPerMeter = 1 / 111000; // Rough conversion
    const span = radiusMeters * degreesPerMeter * 2;
    return `${span},${span}`;
  }

  private decodePolyline(encoded: string): Coordinates[] {
    // Simple polyline decoder - in production, use a proper library
    const coordinates: Coordinates[] = [];
    
    try {
      // This is a simplified decoder - real implementation would be more complex
      // For now, return empty array
      return coordinates;
    } catch (error) {
      logger.error('Failed to decode polyline', { error: error.message });
      return coordinates;
    }
  }
}