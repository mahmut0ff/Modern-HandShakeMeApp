import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ClientProfileRepository } from '../shared/repositories/client-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const clientProfileRepository = new ClientProfileRepository();
const userRepository = new UserRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    let profile = await clientProfileRepository.findByUserId(decoded.userId);
    
    if (!profile) {
      profile = await clientProfileRepository.create(decoded.userId, {
        city: user.city || ''
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        user: formatUserObject(user)
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
