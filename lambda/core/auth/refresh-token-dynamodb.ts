import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../shared/repositories/user.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const userRepository = new UserRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refresh } = body;

    if (!refresh) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Refresh token is required' })
      };
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refresh, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired refresh token' })
      };
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      { userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access: accessToken,
        refresh: refreshToken
      })
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
