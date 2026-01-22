import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Static categories for now - can be moved to DynamoDB later
const categories = [
  { id: '1', name: 'Ремонт и строительство', icon: 'hammer', order: 1 },
  { id: '2', name: 'Красота и здоровье', icon: 'spa', order: 2 },
  { id: '3', name: 'Уборка и клининг', icon: 'cleaning', order: 3 },
  { id: '4', name: 'Грузоперевозки', icon: 'truck', order: 4 },
  { id: '5', name: 'IT и технологии', icon: 'computer', order: 5 },
  { id: '6', name: 'Репетиторство', icon: 'book', order: 6 },
  { id: '7', name: 'Фото и видео', icon: 'camera', order: 7 },
  { id: '8', name: 'Авто услуги', icon: 'car', order: 8 },
  { id: '9', name: 'Юридические услуги', icon: 'gavel', order: 9 },
  { id: '10', name: 'Другое', icon: 'more', order: 10 },
];

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(categories),
    };
  } catch (error: any) {
    console.error('List categories error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
