import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../shared/repositories/user.repository';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'User ID required' }) };
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);

    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Remove sensitive data
    const { verificationCode, verificationCodeExpiry, ...publicUser } = user;

    return {
      statusCode: 200,
      body: JSON.stringify(publicUser),
    };
  } catch (error: any) {
    console.error('Get user error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
