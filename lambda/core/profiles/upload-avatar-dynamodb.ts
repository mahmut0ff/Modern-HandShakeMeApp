import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { UserRepository } from '../shared/repositories/user.repository';
import { v4 as uuidv4 } from 'uuid';

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

    // Parse multipart form data (simplified - in production use multipart parser)
    const body = event.body;
    const isBase64 = event.isBase64Encoded;
    
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `avatars/${decoded.userId}/${fileId}.jpg`;

    // Upload to S3
    const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }));

    const avatarUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // Update user avatar
    await userRepository.update(decoded.userId, {
      avatar: avatarUrl
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Avatar uploaded successfully',
        avatar: avatarUrl
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
