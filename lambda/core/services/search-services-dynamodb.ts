import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { formatPaginatedResponse } from '../shared/utils/response-formatter';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { 
      category, 
      city, 
      min_price, 
      max_price, 
      search,
      page = '1',
      page_size = '20'
    } = event.queryStringParameters || {};

    const pageNum = parseInt(page);
    const limit = parseInt(page_size);

    // Build filter expression
    const filterExpressions: string[] = ['begins_with(SK, :sk)'];
    const expressionValues: any = {
      ':sk': 'SERVICE#'
    };
    const expressionNames: any = {};

    if (category) {
      filterExpressions.push('#category = :category');
      expressionValues[':category'] = parseInt(category);
      expressionNames['#category'] = 'categoryId';
    }

    if (city) {
      filterExpressions.push('contains(#city, :city)');
      expressionValues[':city'] = city;
      expressionNames['#city'] = 'city';
    }

    if (min_price) {
      filterExpressions.push('#priceFrom >= :minPrice');
      expressionValues[':minPrice'] = parseFloat(min_price);
      expressionNames['#priceFrom'] = 'priceFrom';
    }

    if (max_price) {
      filterExpressions.push('#priceFrom <= :maxPrice');
      expressionValues[':maxPrice'] = parseFloat(max_price);
    }

    if (search) {
      filterExpressions.push('(contains(#name, :search) OR contains(description, :search))');
      expressionValues[':search'] = search;
      expressionNames['#name'] = 'name';
    }

    filterExpressions.push('isActive = :active');
    expressionValues[':active'] = true;

    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames }),
      Limit: limit
    }));

    const services = (result.Items || []).map(item => ({
      id: item.serviceId,
      master: item.masterId,
      name: item.name,
      description: item.description,
      category: item.categoryId,
      price_from: item.priceFrom,
      price_to: item.priceTo,
      unit: item.unit,
      is_active: item.isActive,
      created_at: item.createdAt
    }));

    const response = formatPaginatedResponse(services, services.length, pageNum, limit);

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
