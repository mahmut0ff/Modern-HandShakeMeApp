import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
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

    if (project.clientId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Only client can complete project' }) };
    }

    const updated = await projectRepo.update(projectId, {
      status: 'COMPLETED',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    // Update order status
    const orderRepo = new OrderRepository();
    await orderRepo.update(project.orderId, { status: 'COMPLETED' });

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Complete project error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
