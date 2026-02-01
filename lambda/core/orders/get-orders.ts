import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OrderRepository } from '../shared/repositories/order.repository';
import { formatPaginatedResponse, formatOrderObject } from '../shared/utils/response-formatter';
import { verifyToken } from '../shared/services/token';

const orderRepository = new OrderRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const {
      category,
      city,
      budget_min,
      budget_max,
      is_urgent,
      status = 'ACTIVE',
      search,
      page = '1',
      page_size = '20'
    } = event.queryStringParameters || {};

    const pageNum = parseInt(page);
    const limit = parseInt(page_size);

    // Get orders by status or category
    let orders;
    if (category) {
      orders = await orderRepository.findByCategory(category, limit * 2);
    } else {
      orders = await orderRepository.findByStatus(status, limit * 2);
    }

    // Apply filters
    let filteredOrders = orders;

    if (city) {
      filteredOrders = filteredOrders.filter(o => 
        o.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (budget_min) {
      const minBudget = parseFloat(budget_min);
      filteredOrders = filteredOrders.filter(o => 
        o.budgetMin && o.budgetMin >= minBudget
      );
    }

    if (budget_max) {
      const maxBudget = parseFloat(budget_max);
      filteredOrders = filteredOrders.filter(o => 
        o.budgetMax && o.budgetMax <= maxBudget
      );
    }

    if (is_urgent === 'true') {
      filteredOrders = filteredOrders.filter(o => o.isUrgent);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(o =>
        o.title.toLowerCase().includes(searchLower) ||
        o.description.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    const paginatedOrders = filteredOrders.slice(0, limit);

    // Check favorites if user is authenticated
    let favoriteOrderIds: string[] = [];
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        favoriteOrderIds = await orderRepository.getFavorites(decoded.userId);
      }
    } catch (error) {
      // User not authenticated, continue without favorites
    }

    const formattedOrders = paginatedOrders.map(order => ({
      ...formatOrderObject(order),
      isFavorite: favoriteOrderIds.includes(order.id),
    }));

    const response = formatPaginatedResponse(formattedOrders, filteredOrders.length, pageNum, limit);

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