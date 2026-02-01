// Create project milestone

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { MilestoneRepository } from '../shared/repositories/milestone.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const projectRepository = new ProjectRepository();
const milestoneRepository = new MilestoneRepository();

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
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

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project ID is required' })
      };
    }
    
    console.log('Create milestone request', { userId: decoded.userId, projectId });
    
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    let data;
    try {
      data = createMilestoneSchema.parse(body);
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
    
    // Only client or master can create milestones
    if (project.clientId !== decoded.userId && project.masterId !== decoded.userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to create milestones for this project' })
      };
    }
    
    const milestone = await milestoneRepository.create({
      projectId,
      title: data.title,
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate,
      orderNum: data.orderNum ?? 0,
      status: 'PENDING',
    });
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone)
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
