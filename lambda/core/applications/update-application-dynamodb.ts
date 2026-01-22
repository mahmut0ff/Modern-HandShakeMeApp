import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ApplicationRepository } from '../shared/repositories/application.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const applicationRepository = new ApplicationRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const applicationId = event.pathParameters?.id;
    if (!applicationId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Application ID required' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    const updatedApplication = await applicationRepository.update(applicationId, {
      proposedPrice: body.proposed_price,
      message: body.message,
      estimatedDuration: body.estimated_duration
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedApplication)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
