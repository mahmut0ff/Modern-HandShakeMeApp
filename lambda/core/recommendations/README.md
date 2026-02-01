# Recommendations System

Production-ready recommendation system for matching masters with relevant orders.

## Features

- **Smart Scoring Algorithm**: Multi-factor scoring based on category, location, budget, quality, and urgency
- **Location Intelligence**: Distance-based scoring for Kyrgyzstan cities
- **Budget Compatibility**: Advanced budget matching with hourly rate estimation
- **Caching**: 30-minute cache for improved performance
- **Comprehensive Testing**: 14 test cases covering all scenarios

## API Endpoint

### GET /recommendations/orders

Returns personalized order recommendations for masters.

**Authentication**: Required (Master role only)

**Query Parameters**:
- `limit` (optional): Number of recommendations to return (default: 10, max: 50)
- `includeReasons` (optional): Include scoring reasons ("true" | "false", default: "true")

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "order-123",
        "title": "Plumbing repair needed",
        "description": "Fix kitchen sink",
        "category": {
          "id": "1",
          "name": "Repair and Construction"
        },
        "city": "Bishkek",
        "budgetType": "FIXED",
        "budgetMin": 1500,
        "budgetMax": 2000,
        "matchScore": 85,
        "reasons": [
          "Perfect category match",
          "Same city",
          "Good budget match",
          "High-rated master"
        ],
        "skillMatches": 1,
        "totalSkills": 1,
        "daysUntilExpiry": 5,
        "applicationsCount": 2,
        "expiresAt": "2024-02-05T12:00:00.000Z",
        "createdAt": "2024-01-31T10:00:00.000Z"
      }
    ],
    "stats": {
      "totalRecommendations": 5,
      "averageScore": 72,
      "highScoreCount": 2,
      "sameCategory": 3,
      "sameCityCount": 4
    },
    "masterProfile": {
      "id": "master-123",
      "categories": [1, 2],
      "city": "Bishkek",
      "skillsCount": 5,
      "rating": 4.5
    },
    "generatedAt": "2024-01-31T12:00:00.000Z"
  }
}
```

## Scoring Algorithm

The recommendation system uses a weighted scoring algorithm:

### 1. Category Matching (40% weight)
- **Perfect match**: Master's category matches order category (40 points)
- **Multi-category bonus**: Masters with multiple categories get partial score (12 points)

### 2. Skills Matching (25% weight)
- Currently uses category as proxy for skills
- **Category skill match**: 25 points for matching category

### 3. Location Scoring (15% weight)
- **Same city**: 15 points
- **Nearby city** (≤50km): 12 points
- **Regional** (≤100km): 9 points
- **Manageable** (≤200km): 6 points
- **Far** (>200km): 3 points

### 4. Budget Compatibility (10% weight)
- **Excellent match** (≥1.5x rate): 10 points
- **Good match** (≥1.2x rate): 9 points
- **Fair match** (≥1.0x rate): 7 points
- **Tight budget** (≥0.8x rate): 5 points
- **Low budget** (<0.8x rate): 2 points
- **Negotiable**: 8 points

### 5. Master Quality (5% weight)
- **Top-rated experienced** (≥4.8 rating, ≥50 orders): 5 points
- **High-rated experienced** (≥4.5 rating, ≥20 orders): 4 points
- **High-rated** (≥4.5 rating): 3 points
- **Good-rated** (≥4.0 rating): 2 points
- **Experienced** (≥10 orders): 1 point

### 6. Urgency Bonus (5% weight)
- **Very urgent** (expires today): 5 points
- **Urgent** (≤2 days): 4 points
- **Time-sensitive** (≤5 days): 3 points
- **Moderate** (≤10 days): 1 point

## Filtering

Orders are filtered out if:
- Score < 20 points (minimum match threshold)
- Master has already applied to the order
- Order has expired
- Order status is not "ACTIVE"

## Caching

- Cache key: `recommended-orders:{userId}:{queryParams}`
- Cache duration: 30 minutes (1800 seconds)
- Automatic cache invalidation on master profile updates

## Error Handling

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Non-master users
- **404 Not Found**: Master profile not found
- **400 Bad Request**: Invalid query parameters
- **500 Internal Server Error**: Database or system errors

## Performance

- Optimized for 100+ orders processing
- Sub-second response times with caching
- Efficient DynamoDB queries with proper indexing
- Memory-efficient scoring algorithm

## Dependencies

- DynamoDB repositories (Master, Order, Application, Category)
- JWT authentication
- Zod validation
- Redis caching
- Location utilities for distance calculation