import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { ProjectFileRepository } from '../shared/repositories/project-file.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const projectRepository = new ProjectRepository();
const projectFileRepository = new ProjectFileRepository();

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
    
    // Get project to verify ownership
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }
    
    // Only client or master can view project files
    if (project.clientId !== decoded.userId && project.masterId !== decoded.userId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to view files for this project' })
      };
    }

    // Get project files
    const files = await projectFileRepository.findByProject(projectId);
    
    // Format files for response
    const formattedFiles = files.map(file => ({
      id: file.id,
      file: file.fileName,
      file_url: file.fileUrl,
      file_type: file.fileType,
      file_size: file.fileSize,
      mime_type: file.mimeType,
      thumbnail: file.thumbnailUrl,
      description: file.description,
      uploaded_by: file.uploadedBy,
      uploaded_by_user_id: file.uploadedByUserId,
      is_public: file.isPublic,
      created_at: file.createdAt
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedFiles)
    };
  } catch (error) {
    console.error('Error getting project files:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};