# Location System API Examples

This document provides comprehensive examples for using the location system APIs.

## Real-Time Location Tracking

### Start Location Tracking

Start tracking a master's location for a booking or project.

```bash
POST /api/tracking/location
Authorization: Bearer <master_token>
Content-Type: application/json

{
  "action": "START_TRACKING",
  "bookingId": "booking-123",
  "location": {
    "latitude": 42.8746,
    "longitude": 74.5698,
    "accuracy": 5,
    "heading": 180,
    "speed": 25
  },
  "trackingSettings": {
    "updateInterval": 30,
    "highAccuracyMode": true,
    "shareWithClient": true,
    "autoStopAfterCompletion": true,
    "geofenceRadius": 100
  }
}
```

**Response:**
```json
{
  "tracking": {
    "id": "tracking-456",
    "status": "ACTIVE",
    "settings": {
      "updateInterval": 30,
      "shareWithClient": true,
      "geofenceRadius": 100
    },
    "startedAt": "2024-01-01T10:00:00Z"
  },
  "message": "Location tracking started successfully",
  "trackingUrl": "https://app.handshakeme.com/tracking/tracking-456"
}
```

### Update Location

Update the master's current location during active tracking.

```bash
POST /api/tracking/location
Authorization: Bearer <master_token>
Content-Type: application/json

{
  "action": "UPDATE_LOCATION",
  "bookingId": "booking-123",
  "location": {
    "latitude": 42.8750,
    "longitude": 74.5700,
    "accuracy": 3,
    "heading": 185,
    "speed": 30,
    "altitude": 850
  }
}
```

**Response:**
```json
{
  "locationUpdate": {
    "id": "update-789",
    "timestamp": "2024-01-01T10:15:00Z",
    "geofenceStatus": {
      "withinGeofence": false,
      "distance": 250,
      "radius": 100
    }
  },
  "message": "Location updated successfully"
}
```

### Stop Location Tracking

Stop tracking when the work is completed.

```bash
POST /api/tracking/location
Authorization: Bearer <master_token>
Content-Type: application/json

{
  "action": "STOP_TRACKING",
  "bookingId": "booking-123"
}
```

**Response:**
```json
{
  "tracking": {
    "id": "tracking-456",
    "status": "COMPLETED",
    "endedAt": "2024-01-01T11:30:00Z",
    "stats": {
      "duration": 5400,
      "totalDistance": 2500,
      "averageSpeed": 28,
      "maxSpeed": 45,
      "pointsCount": 108
    }
  },
  "message": "Location tracking stopped successfully"
}
```

### Get Current Location

Get the master's current location (available to client if sharing is enabled).

```bash
POST /api/tracking/location
Authorization: Bearer <client_or_master_token>
Content-Type: application/json

{
  "action": "GET_LOCATION",
  "bookingId": "booking-123"
}
```

**Response:**
```json
{
  "tracking": {
    "id": "tracking-456",
    "status": "ACTIVE",
    "startedAt": "2024-01-01T10:00:00Z",
    "lastUpdateAt": "2024-01-01T10:45:00Z"
  },
  "location": {
    "latitude": 42.8755,
    "longitude": 74.5705,
    "accuracy": 4,
    "heading": 190,
    "speed": 25,
    "timestamp": "2024-01-01T10:45:00Z"
  },
  "message": "Current location retrieved successfully"
}
```

### Get Tracking History

Get the complete tracking history with route data.

```bash
POST /api/tracking/location
Authorization: Bearer <client_or_master_token>
Content-Type: application/json

{
  "action": "GET_TRACKING_HISTORY",
  "bookingId": "booking-123",
  "timeRange": {
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T11:30:00Z"
  }
}
```

**Response:**
```json
{
  "tracking": {
    "id": "tracking-456",
    "status": "COMPLETED",
    "startedAt": "2024-01-01T10:00:00Z",
    "endedAt": "2024-01-01T11:30:00Z",
    "stats": {
      "duration": 5400,
      "totalDistance": 2500,
      "averageSpeed": 28,
      "maxSpeed": 45,
      "pointsCount": 108
    }
  },
  "locationHistory": [
    {
      "latitude": 42.8746,
      "longitude": 74.5698,
      "accuracy": 5,
      "heading": 180,
      "speed": 25,
      "timestamp": "2024-01-01T10:00:00Z"
    },
    {
      "latitude": 42.8750,
      "longitude": 74.5700,
      "accuracy": 3,
      "heading": 185,
      "speed": 30,
      "timestamp": "2024-01-01T10:15:00Z"
    }
  ],
  "routeStats": {
    "duration": 5400,
    "totalDistance": 2500,
    "averageSpeed": 28,
    "maxSpeed": 45,
    "pointsCount": 108
  },
  "message": "Tracking history retrieved successfully"
}
```

## Yandex Maps Integration

### Geocode Address

Convert an address to coordinates.

```bash
POST /api/maps/yandex
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "GEOCODE",
  "address": "Чуй проспект 138, Бишкек, Кыргызстан",
  "searchOptions": {
    "language": "ru",
    "limit": 5
  },
  "cacheResults": true
}
```

**Response:**
```json
{
  "results": [
    {
      "address": "Кыргызстан, Бишкек, Чуй проспект, 138",
      "coordinates": {
        "latitude": 42.8746,
        "longitude": 74.5698
      },
      "precision": "exact",
      "kind": "house",
      "components": [
        {
          "kind": "country",
          "name": "Кыргызстан"
        },
        {
          "kind": "locality",
          "name": "Бишкек"
        },
        {
          "kind": "street",
          "name": "Чуй проспект"
        },
        {
          "kind": "house",
          "name": "138"
        }
      ]
    }
  ],
  "cached": false,
  "source": "yandex",
  "query": "Чуй проспект 138, Бишкек, Кыргызстан"
}
```

### Reverse Geocode

Convert coordinates to an address.

```bash
POST /api/maps/yandex
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "REVERSE_GEOCODE",
  "coordinates": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "searchOptions": {
    "language": "ru"
  },
  "cacheResults": true
}
```

**Response:**
```json
{
  "results": [
    {
      "address": "Кыргызстан, Бишкек, Чуй проспект, 138",
      "coordinates": {
        "latitude": 42.8746,
        "longitude": 74.5698
      },
      "precision": "exact",
      "kind": "house",
      "components": [
        {
          "kind": "country",
          "name": "Кыргызстан"
        },
        {
          "kind": "locality",
          "name": "Бишкек"
        }
      ]
    }
  ],
  "cached": false,
  "source": "yandex",
  "coordinates": {
    "latitude": 42.8746,
    "longitude": 74.5698
  }
}
```

### Search Places

Search for places near a location.

```bash
POST /api/maps/yandex
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "SEARCH_PLACES",
  "query": "кафе",
  "coordinates": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "searchOptions": {
    "radius": 1000,
    "limit": 10,
    "language": "ru"
  },
  "cacheResults": true
}
```

**Response:**
```json
{
  "results": [
    {
      "name": "Кафе Навруз",
      "description": "Традиционная кыргызская кухня",
      "address": "Чуй проспект 140, Бишкек",
      "coordinates": {
        "latitude": 42.8748,
        "longitude": 74.5702
      },
      "category": "Кафе",
      "phone": "+996 312 123456",
      "website": "https://navruz-cafe.kg",
      "hours": "09:00-22:00"
    }
  ],
  "cached": false,
  "source": "yandex",
  "query": "кафе",
  "searchArea": {
    "latitude": 42.8746,
    "longitude": 74.5698
  }
}
```

### Get Route

Calculate route between two points.

```bash
POST /api/maps/yandex
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "GET_ROUTE",
  "origin": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "destination": {
    "latitude": 42.8800,
    "longitude": 74.5800
  },
  "waypoints": [
    {
      "latitude": 42.8770,
      "longitude": 74.5750
    }
  ],
  "routeOptions": {
    "mode": "driving",
    "avoidTolls": false,
    "avoidHighways": false,
    "optimize": true
  },
  "cacheResults": true
}
```

**Response:**
```json
{
  "route": {
    "distance": 2500,
    "duration": 420,
    "geometry": [
      {
        "coordinates": [[74.5698, 42.8746], [74.5702, 42.8748]],
        "instruction": "Двигайтесь по Чуй проспект",
        "distance": 500,
        "duration": 60
      }
    ],
    "bounds": [74.5698, 42.8746, 74.5800, 42.8800]
  },
  "cached": false,
  "source": "yandex",
  "origin": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "destination": {
    "latitude": 42.8800,
    "longitude": 74.5800
  }
}
```

### Calculate Distance

Calculate straight-line and route distances.

```bash
POST /api/maps/yandex
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "CALCULATE_DISTANCE",
  "origin": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "destination": {
    "latitude": 42.8800,
    "longitude": 74.5800
  },
  "routeOptions": {
    "mode": "driving"
  }
}
```

**Response:**
```json
{
  "straightDistance": {
    "meters": 1200,
    "kilometers": 1.2,
    "miles": 0.75
  },
  "routeDistance": {
    "meters": 2500,
    "kilometers": 2.5,
    "miles": 1.55
  },
  "routeDuration": {
    "seconds": 420,
    "minutes": 7,
    "hours": 0.12
  },
  "origin": {
    "latitude": 42.8746,
    "longitude": 74.5698
  },
  "destination": {
    "latitude": 42.8800,
    "longitude": 74.5800
  }
}
```

## Nearby Masters Search

### Find Nearby Masters

Search for masters near a specific location.

```bash
GET /api/location/nearby-masters?latitude=42.8746&longitude=74.5698&radius=10&limit=20&offset=0&categoryId=cat-123&verified=true&available=true&minRating=4.0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "masters": [
    {
      "id": "master-1",
      "userId": "user-1",
      "companyName": "Мастер Сервис",
      "description": "Профессиональный ремонт техники",
      "experienceYears": 5,
      "city": "Бишкек",
      "categoryId": "cat-123",
      "rating": 4.8,
      "completedProjectsCount": 150,
      "onTimeRate": 95,
      "isVerified": true,
      "latitude": 42.8750,
      "longitude": 74.5700,
      "distance": 0.5,
      "user": {
        "id": "user-1",
        "email": "master@example.com",
        "firstName": "Азамат",
        "lastName": "Исаков",
        "avatar": "https://cdn.handshakeme.com/avatars/user-1.jpg"
      },
      "category": {
        "id": "cat-123",
        "name": "Ремонт техники"
      },
      "services": [
        {
          "id": "service-1",
          "name": "Ремонт телефонов",
          "priceFrom": 500,
          "priceTo": 3000,
          "unit": "услуга"
        }
      ],
      "portfolio": [
        {
          "id": "portfolio-1",
          "title": "Ремонт iPhone 12",
          "image": "https://cdn.handshakeme.com/portfolio/portfolio-1.jpg"
        }
      ],
      "isAvailable": true
    }
  ],
  "searchParams": {
    "latitude": 42.8746,
    "longitude": 74.5698,
    "radius": 10,
    "categoryId": "cat-123",
    "verified": true,
    "available": true,
    "minRating": 4.0,
    "limit": 20,
    "offset": 0
  },
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "total": 25,
    "averageDistance": 3.2,
    "averageRating": 4.5,
    "verified": 18,
    "byCategory": {
      "Ремонт техники": 15,
      "Строительство": 8,
      "Клининг": 2
    }
  }
}
```

## Error Responses

### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid latitude"
  }
}
```

### Authentication Error
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Permission Error
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view this location"
  }
}
```

### Service Error
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Geocoding service temporarily unavailable"
  }
}
```

## Environment Variables

Required environment variables for the location system:

```bash
# Yandex Maps API
YANDEX_MAPS_API_KEY=your_yandex_maps_api_key

# DynamoDB Tables
LOCATION_TRACKING_TABLE=location-tracking
LOCATION_UPDATES_TABLE=location-updates
TRACKING_EVENTS_TABLE=tracking-events
GEOCODING_CACHE_TABLE=geocoding-cache
MAPS_USAGE_TABLE=maps-usage
MASTERS_TABLE=masters
USERS_TABLE=users
CATEGORIES_TABLE=categories
SERVICES_TABLE=services
PORTFOLIO_TABLE=portfolio
AVAILABILITY_TABLE=availability
CACHE_TABLE=cache

# AWS Configuration
AWS_REGION=us-east-1

# Frontend URL for tracking links
FRONTEND_URL=https://app.handshakeme.com
```

## Rate Limits

- Location updates: 1 request per 5 seconds per tracking session
- Geocoding: 100 requests per hour per user
- Place search: 50 requests per hour per user
- Route calculation: 20 requests per hour per user
- Nearby masters search: 200 requests per hour per user

## Caching

- Geocoding results: 24 hours
- Reverse geocoding: 24 hours
- Place search: 6 hours
- Route calculation: 2 hours
- Nearby masters: 10 minutes

## WebSocket Events

Real-time location updates are broadcast via WebSocket to clients:

### Location Update Event
```json
{
  "type": "LOCATION_UPDATE",
  "data": {
    "trackingId": "tracking-456",
    "masterId": "master-123",
    "location": {
      "latitude": 42.8750,
      "longitude": 74.5700,
      "accuracy": 3,
      "heading": 185,
      "speed": 30
    },
    "timestamp": "2024-01-01T10:15:00Z",
    "geofenceStatus": {
      "withinGeofence": false,
      "distance": 250,
      "radius": 100
    }
  }
}
```

### Tracking Event
```json
{
  "type": "TRACKING_EVENT",
  "data": {
    "trackingId": "tracking-456",
    "eventType": "ARRIVAL",
    "timestamp": "2024-01-01T11:00:00Z",
    "message": "Мастер прибыл к месту выполнения работ"
  }
}
```