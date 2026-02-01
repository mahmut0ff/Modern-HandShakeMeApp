// Location utilities for recommendations

export interface CityCoordinates {
  lat: number;
  lng: number;
}

// Major cities in Kyrgyzstan with coordinates
export const KYRGYZSTAN_CITIES: Record<string, CityCoordinates> = {
  'bishkek': { lat: 42.8746, lng: 74.5698 },
  'osh': { lat: 40.5283, lng: 72.7985 },
  'jalal-abad': { lat: 40.9333, lng: 73.0000 },
  'karakol': { lat: 42.4906, lng: 78.3931 },
  'tokmok': { lat: 42.8417, lng: 75.3014 },
  'kara-balta': { lat: 42.8144, lng: 73.8486 },
  'kant': { lat: 42.8931, lng: 74.8506 },
  'kyzyl-kiya': { lat: 40.2569, lng: 72.1281 },
  'suluktu': { lat: 39.9364, lng: 69.5675 },
  'isfana': { lat: 39.8333, lng: 69.5333 },
};

/**
 * Calculate distance between two cities using Haversine formula
 */
export function calculateDistance(city1: string, city2: string): number {
  const coords1 = KYRGYZSTAN_CITIES[city1.toLowerCase()];
  const coords2 = KYRGYZSTAN_CITIES[city2.toLowerCase()];
  
  if (!coords1 || !coords2) {
    // If coordinates not found, return a default distance
    return city1.toLowerCase() === city2.toLowerCase() ? 0 : 100;
  }
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coords2.lat - coords1.lat);
  const dLng = toRadians(coords2.lng - coords1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) * Math.cos(toRadians(coords2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * Get location score based on distance
 */
export function getLocationScore(masterCity: string, orderCity: string, maxScore = 15): number {
  const distance = calculateDistance(masterCity, orderCity);
  
  if (distance === 0) {
    return maxScore; // Same city
  } else if (distance <= 50) {
    return Math.round(maxScore * 0.8); // Nearby city
  } else if (distance <= 100) {
    return Math.round(maxScore * 0.6); // Regional
  } else if (distance <= 200) {
    return Math.round(maxScore * 0.4); // Far but manageable
  } else {
    return Math.round(maxScore * 0.2); // Very far
  }
}

/**
 * Get location reason based on distance
 */
export function getLocationReason(masterCity: string, orderCity: string): string {
  const distance = calculateDistance(masterCity, orderCity);
  
  if (distance === 0) {
    return 'Same city';
  } else if (distance <= 50) {
    return `Nearby city (${distance}km)`;
  } else if (distance <= 100) {
    return `Regional location (${distance}km)`;
  } else if (distance <= 200) {
    return `Manageable distance (${distance}km)`;
  } else {
    return `Far location (${distance}km)`;
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Normalize city name for consistent matching
 */
export function normalizeCityName(city: string): string {
  return city.toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/ъ/g, '')
    .replace(/ь/g, '')
    .trim();
}