// Update project milestone

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  orderNum: z.number().int().nonnegative().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get token from header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    const milestoneId = event.pathParameters?.id;
    const projectId = event.pathParameters?.projectId;
    
    if (!milestoneId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Milestone ID is required' })
      };
    }

    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project ID is required' })
      };
    }
    
    console.log('Update milestone request', { userId: decoded.userId, milestoneId, projectId });
    
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    let data;
    try {
      data = updateMilestoneSchema.parse(body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: error instanceof z.ZodError ? error.errors : 'Validation failed'
        })
      };
    }
    
    // Get project to verify ownership
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }
    
    // Only client or master can update milestones
    if (project.clientId !== decoded.userId && project.masterId !== decoded.userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to update this milestone' })
      };
    }
    
    // Check if milestone exists
    const milestone = await milestoneRepository.findById(milestoneId, projectId);
    if (!milestone) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Milestone not found' })
      };
    }
    
    // Add completion timestamp if status is being set to completed
    const updateData: any = { ...data };
    if (data.status === 'COMPLETED' && milestone.status !== 'COMPLETED') {
      updateData.completedAt = new Date().toISOString();
    }
    
    const updated = await milestoneRepository.update(milestoneId, projectId, updateData);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    };
  } catch (error) {
    console.error('Error updating milestone:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
