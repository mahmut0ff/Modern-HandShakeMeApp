import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { OrderRepository } from '../shared/repositories/order.repository';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { ProjectRepository } from '../shared/repositories/project.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const masterProfileRepository = new MasterProfileRepository();
const orderRepository = new OrderRepository();
const reviewRepository = new ReviewRepository();
const projectRepository = new ProjectRepository();

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

    // Get master profile
    const profile = await masterProfileRepository.findByUserId(decoded.userId);
    if (!profile) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Master profile not found' })
      };
    }

    // Get projects
    const projects = await projectRepository.findByMaster(decoded.userId);
    
    // Get reviews
    const reviews = await reviewRepository.findByMaster(decoded.userId);

    // Calculate statistics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : '0';

    // Calculate earnings (from completed projects)
    const totalEarnings = projects
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.agreedPrice || '0'), 0);

    // Calculate this month stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthProjects = projects.filter(p => 
      new Date(p.createdAt) >= monthStart
    ).length;

    const thisMonthEarnings = projects
      .filter(p => 
        p.status === 'COMPLETED' && 
        p.completedAt && 
        new Date(p.completedAt) >= monthStart
      )
      .reduce((sum, p) => sum + parseFloat(p.agreedPrice || '0'), 0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_projects: totalProjects,
        completed_projects: completedProjects,
        active_projects: activeProjects,
        total_reviews: totalReviews,
        average_rating: averageRating,
        total_earnings: totalEarnings.toFixed(2),
        this_month_projects: thisMonthProjects,
        this_month_earnings: thisMonthEarnings.toFixed(2),
        success_rate: totalProjects > 0 
          ? ((completedProjects / totalProjects) * 100).toFixed(1)
          : '0'
      })
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
