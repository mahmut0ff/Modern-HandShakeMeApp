import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { verifyToken } from '../shared/services/token';

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'REVIEW', 'REVISION', 'COMPLETED', 'ARCHIVED']),
  progress: z.number().min(0).max(100).optional(),
});

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

    if (project.masterId !== decoded.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const data = updateStatusSchema.parse(body);

    const updateData: any = { status: data.status };
    
    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    if (data.status === 'IN_PROGRESS' && !project.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }

    if (data.status === 'COMPLETED' && !project.completedAt) {
      updateData.completedAt = new Date().toISOString();
      updateData.progress = 100;
    }

    const updated = await projectRepo.update(projectId, updateData);

    return {
      statusCode: 200,
      body: JSON.stringify(updated),
    };
  } catch (error: any) {
    console.error('Update project status error:', error);
    return {
      statusCode: error.name === 'ZodError' ? 400 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
