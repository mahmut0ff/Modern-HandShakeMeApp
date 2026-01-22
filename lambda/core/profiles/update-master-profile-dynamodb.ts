import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const masterProfileRepository = new MasterProfileRepository();

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

    const updatedProfile = await masterProfileRepository.update(decoded.userId, {
      categories: body.categories,
      skills: body.skills,
      bio: body.bio,
      experienceYears: body.experience_years,
      hourlyRate: body.hourly_rate?.toString(),
      city: body.city,
      isAvailable: body.is_available
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
