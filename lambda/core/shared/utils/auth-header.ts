// Utility to extract auth token from headers (case-insensitive)

import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Extract Bearer token from Authorization header (case-insensitive)
 * API Gateway may normalize headers to lowercase, so we check both cases
 */
export function extractAuthToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Remove 'Bearer ' prefix (case-insensitive)
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  return token || null;
}

/**
 * Get all headers in a case-insensitive way
 */
export function getHeader(event: APIGatewayProxyEvent, headerName: string): string | undefined {
  const lowerHeaderName = headerName.toLowerCase();
  
  // Check exact match first
  if (event.headers[headerName]) {
    return event.headers[headerName];
  }
  
  // Check lowercase match
  if (event.headers[lowerHeaderName]) {
    return event.headers[lowerHeaderName];
  }
  
  // Check all headers case-insensitively
  for (const [key, value] of Object.entries(event.headers)) {
    if (key.toLowerCase() === lowerHeaderName) {
      return value;
    }
  }
  
  return undefined;
}
