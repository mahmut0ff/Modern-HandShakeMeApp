// Get profile visibility settings Lambda function

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const masterProfileRepository = new MasterProfileRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    const userId = decoded.userId;
    
    if (decoded.role !== 'MASTER') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only masters can access profile visibility settings' })
      };
    }
    
    console.log('Get profile visibility request', { userId });
    
    // Get master profile
    let masterProfile = await masterProfileRepository.findByUserId(userId);
    
    if (!masterProfile) {
      // Create default profile with default visibility settings
      masterProfile = await masterProfileRepository.create(userId, {
        city: '',
        isAvailable: true
      });
      
      console.log('Master profile created with default visibility', { userId });
    }
    
    console.log('Profile visibility retrieved successfully', { userId });
    
    // Return visibility settings (using defaults if not set)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_profile_public: true, // Default to public
        show_phone: true,
        show_email: false,
        show_location: true,
        show_rating: true,
        show_reviews: true,
        show_portfolio: true,
        show_services: true,
      })
    };
  } catch (error) {
    console.error('Error getting profile visibility:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
