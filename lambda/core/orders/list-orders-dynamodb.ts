import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { formatPaginatedResponse, formatOrderObject } from '../shared/utils/response-formatter';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { status, categoryId, limit, page } = event.queryStringParameters || {};
    
    const orderRepo = new OrderRepository();
    let orders;

    const limitNum = limit ? parseInt(limit) : 20;
    const pageNum = page ? parseInt(page) : 1;

    if (categoryId) {
      orders = await orderRepo.findByCategory(categoryId, limitNum);
    } else if (status) {
      orders = await orderRepo.findByStatus(status, limitNum);
    } else {
      orders = await orderRepo.findByStatus('ACTIVE', limitNum);
    }

    const formattedOrders = orders.map(formatOrderObject);
    const response = formatPaginatedResponse(formattedOrders, formattedOrders.length, pageNum, limitNum);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('List orders error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
