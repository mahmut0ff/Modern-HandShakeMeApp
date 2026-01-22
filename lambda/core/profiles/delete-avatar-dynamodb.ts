import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { UserRepository } from '../shared/repositories/user.repository';

const s3Client = new S3Client({});
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
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

    // Get current user
    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.avatar) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No avatar to delete' })
      };
    }

    // Extract S3 key from URL
    const avatarUrl = user.avatar;
    const key = avatarUrl.split('.com/')[1];

    // Delete from S3
    if (key) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
    }

    // Update user
    await userRepository.update(decoded.userId, {
      avatar: null
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Avatar deleted successfully' })
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
