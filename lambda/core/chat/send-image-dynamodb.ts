import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ChatRepository } from '../shared/repositories/chat.repository';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const chatRepository = new ChatRepository();

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

    const roomId = event.pathParameters?.id;
    if (!roomId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Room ID required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const body = event.body;
    const isBase64 = event.isBase64Encoded;
    
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No image provided' })
      };
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `chat/${roomId}/${fileId}.jpg`;

    // Upload to S3
    const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }));

    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // Create message with image
    const message = await chatRepository.createMessage({
      roomId,
      senderId: decoded.userId,
      type: 'IMAGE',
      content: imageUrl,
      fileUrl: imageUrl
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: message.id,
        room: roomId,
        sender_id: decoded.userId,
        message_type: 'image',
        image_url: imageUrl,
        created_at: message.createdAt
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
