import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

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

    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order ID required' })
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
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileName = `orders/${orderId}/${fileId}.jpg`;

    // Upload to S3
    const buffer = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }));

    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // Save file metadata to DynamoDB
    const file = {
      fileId,
      orderId,
      fileUrl,
      fileName,
      fileType: 'photo',
      uploadedBy: decoded.userId,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `ORDER#${orderId}`,
        SK: `FILE#${fileId}`,
        ...file
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: fileId,
        file_url: fileUrl,
        file_type: 'photo',
        created_at: file.createdAt
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
