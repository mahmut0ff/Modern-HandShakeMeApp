import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { OrderFileRepository } from '../shared/repositories/order-file.repository';

const orderRepository = new OrderRepository();
const orderFileRepository = new OrderFileRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order ID is required' })
      };
    }

    // Check if order exists
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    // Get order files
    const files = await orderFileRepository.findByOrder(orderId);

    // Format response
    const response = files.map(file => ({
      id: file.id,
      file: file.fileName,
      file_url: file.fileUrl,
      file_type: file.fileType,
      thumbnail: file.thumbnail,
      order_num: file.orderNum,
      created_at: file.createdAt,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
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