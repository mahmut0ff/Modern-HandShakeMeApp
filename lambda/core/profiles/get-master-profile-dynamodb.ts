import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, notFound, badRequest } from '../shared/utils/response';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { PortfolioRepository } from '../shared/repositories/portfolio.repository';
import { ReviewRepository } from '../shared/repositories/review.repository';
import { formatUserObject } from '../shared/utils/response-formatter';
import { logger } from '../shared/utils/logger';

const masterProfileRepository = new MasterProfileRepository();
const userRepository = new UserRepository();
const portfolioRepository = new PortfolioRepository();
const reviewRepository = new ReviewRepository();

async function getMasterProfileHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return badRequest('User ID is required');
  }

  logger.info('Get master profile', { userId });

  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound('User not found');
  }

  const profile = await masterProfileRepository.findByUserId(userId);
  if (!profile) {
    return notFound('Master profile not found');
  }

  // Fetch portfolio items
  const { items: portfolio } = await portfolioRepository.findMasterItems(userId, { isPublic: true });

  // Fetch recent reviews
  const { items: reviews } = await reviewRepository.findByMaster(userId, { limit: 10 });

  return success({
    ...profile,
    user: formatUserObject(user),
    portfolio,
    reviews
  });
}

export const handler = withErrorHandler(getMasterProfileHandler);
