import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatUserObject } from '../shared/utils/response-formatter';

const masterProfileRepository = new MasterProfileRepository();
const userRepository = new UserRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get master profile
    const profile = await masterProfileRepository.findByUserId(userId);
    if (!profile) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Master profile not found' })
      };
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
    console.error('Error getting master profile:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
