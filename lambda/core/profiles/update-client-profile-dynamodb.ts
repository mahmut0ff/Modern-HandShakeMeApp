import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { ClientProfileRepository } from '../shared/repositories/client-profile.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const clientProfileRepository = new ClientProfileRepository();

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

    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const body = JSON.parse(event.body || '{}');

    const updatedProfile = await clientProfileRepository.update(decoded.userId, {
      bio: body.bio,
      city: body.city,
      address: body.address,
      companyName: body.company_name,
      preferredContactMethod: body.preferred_contact_method
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
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
