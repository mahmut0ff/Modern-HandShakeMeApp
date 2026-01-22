import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { UserRepository } from '../shared/repositories/user.repository';
import { verifyToken } from '../shared/services/token';

const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = updateUserSchema.parse(body);

    const userRepo = new UserRepository();
    const updated = await userRepo.update(decoded.userId, data);

    // Remove sensitive data
    const { verificationCode, verificationCodeExpiry, ...publicUser } = updated;

    return {
      statusCode: 200,
      body: JSON.stringify(publicUser),
    };
  } catch (error: any) {
    console.error('Update user error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
