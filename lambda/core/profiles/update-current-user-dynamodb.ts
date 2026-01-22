import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const userRepository = new UserRepository();

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

    const body = JSON.parse(event.body || '{}');
    
    // Update user
    const updatedUser = await userRepository.update(decoded.userId, {
      firstName: body.first_name,
      lastName: body.last_name,
      avatar: body.avatar
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatUserObject(updatedUser))
    };
  } catch (error) {
    console.error('Error updating current user:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
