import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { OrderRepository } from '../shared/repositories/order.repository';
import { formatPaginatedResponse, formatOrderObject } from '../shared/utils/response-formatter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const orderRepository = new OrderRepository();

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
    
    const { status } = event.queryStringParameters || {};

    // Get orders by client
    const orders = await orderRepository.findByClient(decoded.userId);
    
    let filteredOrders = orders;
    if (status) {
      filteredOrders = orders.filter(o => o.status === status);
    }

    const formattedOrders = filteredOrders.map(formatOrderObject);
    const response = formatPaginatedResponse(formattedOrders, formattedOrders.length);

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
