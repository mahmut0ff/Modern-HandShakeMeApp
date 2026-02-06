import { APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { success, badRequest, notFound, forbidden } from '../shared/utils/response';
import { logger } from '../shared/utils/logger';
import { ProjectRepository } from '../shared/repositories/project.repository';
import { ProjectFileRepository } from '../shared/repositories/project-file.repository';

const projectRepository = new ProjectRepository();
const projectFileRepository = new ProjectFileRepository();

const getProjectFilesHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const { userId } = event.auth;

  const projectId = event.pathParameters?.id;
  if (!projectId) {
    return badRequest('Project ID is required');
  }
  
  logger.info('Get project files request', { userId, projectId });
  
  // Get project to verify ownership
  const project = await projectRepository.findById(projectId);
  if (!project) {
    return notFound('Project not found');
  }
  
  // Only client or master can view project files
  if (project.clientId !== userId && project.masterId !== userId) {
    return forbidden('You do not have permission to view files for this project');
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

  return success(formattedFiles);
};

export const handler = withErrorHandler(withAuth(getProjectFilesHandler));