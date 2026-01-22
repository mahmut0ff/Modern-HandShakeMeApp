import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ApplicationRepository } from '../shared/repositories/application.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { verifyToken } from '../shared/services/token';

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const { orderId, applicationId } = event.pathParameters || {};

    if (!orderId || !applicationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order ID and Application ID required' }) };
    }

    const orderRepo = new OrderRepository();
    const order = await orderRepo.findById(orderId);

    if (!order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    if (order.clientId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const appRepo = new ApplicationRepository();
    const application = await appRepo.findById(orderId, applicationId);

    if (!application) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Application not found' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { action } = respondSchema.parse(body);

    if (action === 'ACCEPT') {
      await appRepo.update(orderId, applicationId, { status: 'ACCEPTED' });
      
      // Create project
      const projectRepo = new ProjectRepository();
      const project = await projectRepo.create({
        orderId,
        masterId: application.masterId,
        clientId: order.clientId,
        applicationId: application.id,
        agreedPrice: application.proposedPrice,
        deadline: new Date(Date.now() + application.proposedDurationDays * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Update order status
      await orderRepo.update(orderId, { status: 'IN_PROGRESS' });

      return {
        statusCode: 200,
        body: JSON.stringify({ application, project }),
      };
    } else {
      await appRepo.update(orderId, applicationId, { status: 'REJECTED' });

      return {
        statusCode: 200,
        body: JSON.stringify({ application }),
      };
    }
  } catch (error: any) {
    console.error('Respond to application error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
