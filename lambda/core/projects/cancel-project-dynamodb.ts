import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ProjectRepository } from '../shared/repositories/project.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const projectRepository = new ProjectRepository();

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

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project ID required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    const updatedProject = await projectRepository.update(projectId, {
      status: 'CANCELLED',
      notes: reason,
      cancelledAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
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
