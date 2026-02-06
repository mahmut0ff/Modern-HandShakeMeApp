import { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.S3_BUCKET || 'handshake-uploads';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

const uploadOrderFileHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const orderId = event.pathParameters?.id;
  if (!orderId) {
    return badRequest('Order ID required');
  }

  const body = event.body;
  const isBase64 = event.isBase64Encoded;
  
  if (!body) {
    return badRequest('No file provided');
  }

  logger.info('Upload order file request', { userId, orderId });

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
    uploadedBy: userId,
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

  logger.info('Order file uploaded successfully', { userId, orderId, fileId });

  return success({
    id: fileId,
    file_url: fileUrl,
    file_type: 'photo',
    created_at: file.createdAt
  });
};

export const handler = withErrorHandler(withAuth(uploadOrderFileHandler));
