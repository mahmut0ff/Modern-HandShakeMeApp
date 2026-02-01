import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { OrderFileRepository } from '../shared/repositories/order-file.repository';
import { S3Service } from '../shared/services/s3';
import { verifyToken } from '../shared/services/token';
import { v4 as uuidv4 } from 'uuid';

const orderRepository = new OrderRepository();
const orderFileRepository = new OrderFileRepository();
const s3Service = new S3Service();

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
        body: JSON.stringify({ error: 'Order ID is required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Verify order exists and user owns it
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    if (order.clientId !== userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You can only add files to your own orders' })
      };
    }

    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
      };
    }

    // Extract file from body
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');

    if (!body || body.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    // Determine file type
    const fileType = contentType.includes('image') ? 'photo' : 
                     contentType.includes('video') ? 'video' : 'document';

    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = fileType === 'photo' ? 'jpg' : 
                         fileType === 'video' ? 'mp4' : 'pdf';
    const fileName = `orders/${orderId}/${fileId}.${fileExtension}`;

    // Upload to S3
    const fileUrl = await s3Service.uploadFile(fileName, body, contentType);

    // Get next order number
    const nextOrderNum = await orderFileRepository.getNextOrderNum(orderId);

    // Create file record
    const file = await orderFileRepository.create({
      orderId,
      fileName,
      fileUrl,
      fileType,
      orderNum: nextOrderNum,
      uploadedBy: userId,
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: file.id,
        file: file.fileName,
        file_url: file.fileUrl,
        file_type: file.fileType,
        thumbnail: file.thumbnail,
        order_num: file.orderNum,
        created_at: file.createdAt,
      })
    };
  } catch (error) {
    console.error('Error:', error);
    
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
      body: JSON.stringify({ error: 'Failed to upload file' })
    };
  }
};