import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../shared/services/token';
import { UserService } from '../shared/services/user.service';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const userService = new UserService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate user
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get user information
    const user = await userService.findUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    // Validate user is a master
    if (user.role !== 'MASTER') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only masters can upload portfolio images' })
      };
    }

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

    console.log('Upload portfolio image request', { userId });

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `portfolio/${userId}/${fileId}.jpg`;

    // Upload to S3
    const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    
    // Validate file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File too large. Maximum size is 5MB' })
      };
    }
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
      Metadata: {
        'uploaded-by': userId,
        'upload-timestamp': new Date().toISOString(),
        'file-type': 'portfolio-image'
      }
    }));

    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    console.log('Portfolio image uploaded successfully', { userId, imageUrl });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        url: imageUrl,
        message: 'Image uploaded successfully'
      })
    };

  } catch (error: any) {
    console.error('Error uploading portfolio image:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to upload image',
        message: error.message 
      })
    };
  }
};
