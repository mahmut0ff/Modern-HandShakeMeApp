// Create payment method Lambda function

import type { APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withRequestTransform } from '../shared/middleware/requestTransform';
import { logger } from '../shared/utils/logger';
import { z } from 'zod';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'handshake-table';

const createPaymentMethodSchema = z.object({
  method_type: z.string(),
  provider: z.string(),
  name: z.string(),
  details: z.record(z.any()).optional(),
  is_default: z.boolean().optional(),
});

async function createPaymentMethodHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Create payment method request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const validationResult = createPaymentMethodSchema.safeParse(body);
  
  if (!validationResult.success) {
    return badRequest('Invalid input data');
  }
  
  const { method_type, provider, name, details, is_default } = validationResult.data;
  
  const methodId = uuidv4();
  const paymentMethod = {
    methodId,
    userId,
    methodType: method_type,
    provider,
    name,
    details: details || {},
    isDefault: is_default || false,
    isVerified: false,
    createdAt: new Date().toISOString()
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${userId}`,
      SK: `PAYMENT_METHOD#${methodId}`,
      ...paymentMethod
    }
  }));
  
  logger.info('Payment method created successfully', { userId, methodId });
  
  return success({
    id: methodId,
    method_type,
    provider,
    name,
    is_default: is_default || false,
    is_verified: false,
    created_at: paymentMethod.createdAt
  });
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(createPaymentMethodHandler)
  )
);
