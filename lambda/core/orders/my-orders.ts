import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { OrderFileRepository } from '../shared/repositories/order-file.repository';
import { formatPaginatedResponse, formatOrderObject } from '../shared/utils/response-formatter';
import { verifyToken } from '../shared/services/token';

const orderRepository = new OrderRepository();
const orderFileRepository = new OrderFileRepository();

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
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const {
      status,
      page = '1',
      page_size = '20'
    } = event.queryStringParameters || {};

    const pageNum = parseInt(page);
    const pageSize = parseInt(page_size);

    // Get user's orders with filters
    const result = await orderRepository.findByClientWithFilters(userId, {
      status,
      page: pageNum,
      pageSize
    });

    // Get favorites for this user
    const favoriteOrderIds = await orderRepository.getFavorites(userId);

    // Format orders and add additional data
    const formattedOrders = await Promise.all(
      result.orders.map(async (order) => {
        // Get files for this order
        const files = await orderFileRepository.findByOrder(order.id);
        
        return {
          ...formatOrderObject(order),
          isFavorite: favoriteOrderIds.includes(order.id),
          hasApplied: false, // User can't apply to their own orders
          applicationId: null,
          files: files.map(file => ({
            id: file.id,
            file_url: file.fileUrl,
            file_type: file.fileType,
            thumbnail: file.thumbnail,
            order_num: file.orderNum,
            created_at: file.createdAt
          }))
        };
      })
    );

    const response = formatPaginatedResponse(formattedOrders, result.total, pageNum, pageSize);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};