// Update master profile Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { success, forbidden, notFound, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

const updateMasterSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().max(100).optional(),
  categoryId: z.string().optional(),
  categories: z.array(z.any()).optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  experienceYears: z.number().optional(),
  workRadius: z.number().optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  workSchedule: z.any().optional(),
  isAvailable: z.boolean().optional()
});

async function updateMasterHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  if (event.auth.role !== 'MASTER') {
    return forbidden('Only masters can update master profile');
  }
  
  logger.info('Update master profile', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const result = updateMasterSchema.safeParse(body);
  
  if (!result.success) {
    return badRequest('Invalid request data');
  }
  
  const data = result.data;
  
  // Get master profile
  const profileResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'MASTER_PROFILE#'
    }
  }));
  
  if (!profileResult.Items || profileResult.Items.length === 0) {
    return notFound('Master profile not found');
  }
  
  const profile = profileResult.Items[0];
  
  // Check if category exists (if being updated)
  if (data.categoryId) {
    const categoryResult = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CATEGORY#${data.categoryId}`,
        SK: `METADATA#${data.categoryId}`
      }
    }));
    
    if (!categoryResult.Item) {
      return notFound('Category not found');
    }
  }
  
  // Build update expression
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  if (data.companyName !== undefined) {
    updateExpressions.push('#companyName = :companyName');
    expressionAttributeNames['#companyName'] = 'companyName';
    expressionAttributeValues[':companyName'] = data.companyName;
  }
  
  if (data.bio !== undefined) {
    updateExpressions.push('#bio = :bio');
    expressionAttributeNames['#bio'] = 'bio';
    expressionAttributeValues[':bio'] = data.bio;
  }
  
  if (data.city !== undefined) {
    updateExpressions.push('#city = :city');
    expressionAttributeNames['#city'] = 'city';
    expressionAttributeValues[':city'] = data.city;
  }
  
  if (data.categories !== undefined) {
    updateExpressions.push('#categories = :categories');
    expressionAttributeNames['#categories'] = 'categories';
    expressionAttributeValues[':categories'] = data.categories;
  }
  
  if (data.skills !== undefined) {
    updateExpressions.push('#skills = :skills');
    expressionAttributeNames['#skills'] = 'skills';
    expressionAttributeValues[':skills'] = data.skills;
  }
  
  if (data.hourlyRate !== undefined) {
    updateExpressions.push('#hourlyRate = :hourlyRate');
    expressionAttributeNames['#hourlyRate'] = 'hourlyRate';
    expressionAttributeValues[':hourlyRate'] = data.hourlyRate;
  }
  
  if (data.experienceYears !== undefined) {
    updateExpressions.push('#experienceYears = :experienceYears');
    expressionAttributeNames['#experienceYears'] = 'experienceYears';
    expressionAttributeValues[':experienceYears'] = data.experienceYears;
  }
  
  if (data.workRadius !== undefined) {
    updateExpressions.push('#workRadius = :workRadius');
    expressionAttributeNames['#workRadius'] = 'workRadius';
    expressionAttributeValues[':workRadius'] = data.workRadius;
  }
  
  if (data.languages !== undefined) {
    updateExpressions.push('#languages = :languages');
    expressionAttributeNames['#languages'] = 'languages';
    expressionAttributeValues[':languages'] = data.languages;
  }
  
  if (data.certifications !== undefined) {
    updateExpressions.push('#certifications = :certifications');
    expressionAttributeNames['#certifications'] = 'certifications';
    expressionAttributeValues[':certifications'] = data.certifications;
  }
  
  if (data.education !== undefined) {
    updateExpressions.push('#education = :education');
    expressionAttributeNames['#education'] = 'education';
    expressionAttributeValues[':education'] = data.education;
  }
  
  if (data.workSchedule !== undefined) {
    updateExpressions.push('#workSchedule = :workSchedule');
    expressionAttributeNames['#workSchedule'] = 'workSchedule';
    expressionAttributeValues[':workSchedule'] = data.workSchedule;
  }
  
  if (data.isAvailable !== undefined) {
    updateExpressions.push('#isAvailable = :isAvailable');
    expressionAttributeNames['#isAvailable'] = 'isAvailable';
    expressionAttributeValues[':isAvailable'] = data.isAvailable;
  }
  
  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  
  if (updateExpressions.length === 1) { // Only updatedAt
    return badRequest('No fields to update');
  }
  
  // Update profile
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: profile.PK,
      SK: profile.SK
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  }));
  
  // Get updated profile
  const updatedResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'MASTER_PROFILE#'
    }
  }));
  
  const updatedProfile = updatedResult.Items?.[0];
  
  logger.info('Master profile updated', { userId, profileId: updatedProfile?.profileId });
  
  return success(updatedProfile);
}

export const handler = withErrorHandler(withRequestTransform(withAuth(updateMasterHandler)));
