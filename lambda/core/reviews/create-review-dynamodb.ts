import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { verifyToken } from '../shared/services/token';

const createReviewSchema = z.object({
  projectId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const decoded = verifyToken(token);
    const body = JSON.parse(event.body || '{}');
    const data = createReviewSchema.parse(body);

    const projectRepo = new ProjectRepository();
    const project = await projectRepo.findById(data.projectId);

    if (!project) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Project not found' }) };
    }

    if (project.clientId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Only client can review' }) };
    }

    if (project.status !== 'COMPLETED') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Project must be completed' }) };
    }

    const reviewRepo = new ReviewRepository();
    const review = await reviewRepo.create({
      ...data,
      masterId: project.masterId,
      clientId: decoded.userId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(review),
    };
  } catch (error: any) {
    console.error('Create review error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
