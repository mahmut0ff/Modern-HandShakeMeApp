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
    const projectId = event.pathParameters?.id;

    if (!projectId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Project ID required' }) };
    }

    const projectRepo = new ProjectRepository();
    const project = await projectRepo.findById(projectId);

    if (!project) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Project not found' }) };
    }

    if (project.masterId !== decoded.userId && project.clientId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(project),
    };
  } catch (error: any) {
    console.error('Get project error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
