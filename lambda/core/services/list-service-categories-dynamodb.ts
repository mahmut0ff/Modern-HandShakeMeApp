import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Static service categories
const CATEGORIES = [
  { id: 1, name: 'Ремонт и строительство', slug: 'repair', icon: 'hammer' },
  { id: 2, name: 'Электрика', slug: 'electric', icon: 'bolt' },
  { id: 3, name: 'Сантехника', slug: 'plumbing', icon: 'water' },
  { id: 4, name: 'Отделочные работы', slug: 'finishing', icon: 'paint' },
  { id: 5, name: 'Уборка', slug: 'cleaning', icon: 'broom' },
  { id: 6, name: 'Грузоперевозки', slug: 'moving', icon: 'truck' },
  { id: 7, name: 'Мебель', slug: 'furniture', icon: 'chair' },
  { id: 8, name: 'Техника', slug: 'appliances', icon: 'tv' },
  { id: 9, name: 'Компьютеры', slug: 'computers', icon: 'laptop' },
  { id: 10, name: 'Автомобили', slug: 'auto', icon: 'car' }
];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: CATEGORIES, count: CATEGORIES.length })
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
