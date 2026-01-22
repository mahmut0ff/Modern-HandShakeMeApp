import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { verifyToken } from '../shared/services/token';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const projectRepo = new ProjectRepository();
    const projects = await projectRepo.findByUser(decoded.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(projects),
    };
  } catch (error: any) {
    console.error('Get my projects error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
