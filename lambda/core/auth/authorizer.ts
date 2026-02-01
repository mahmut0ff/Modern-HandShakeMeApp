// Lambda authorizer for API Gateway

import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';
import { verifyToken } from '../shared/services/token';
import { logger } from '../shared/utils/logger';

export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  logger.info('Authorizer invoked');
  
  try {
    // Extract token from Authorization header
    const token = event.authorizationToken.replace('Bearer ', '');
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Generate policy
    const policy: APIGatewayAuthorizerResult = {
      principalId: decoded.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    };
    
    logger.info('Authorization successful', { userId: decoded.userId });
    
    return policy;
  } catch (error) {
    logger.error('Authorization failed', error);
    throw new Error('Unauthorized');
  }
}
