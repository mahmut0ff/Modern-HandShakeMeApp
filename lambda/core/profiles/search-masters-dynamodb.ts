import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { formatPaginatedResponse } from '../shared/utils/response-formatter';

const masterProfileRepository = new MasterProfileRepository();
const userRepository = new UserRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const {
      category,
      city,
      min_rating,
      is_verified,
      is_available,
      search,
      page = '1',
      page_size = '20'
    } = event.queryStringParameters || {};

    const pageNum = parseInt(page);
    const limit = parseInt(page_size);

    // Search masters
    const profiles = await masterProfileRepository.search({
      city,
      category: category ? parseInt(category) : undefined,
      minRating: min_rating ? parseFloat(min_rating) : undefined,
      isVerified: is_verified === 'true',
      isAvailable: is_available === 'true',
      limit
    });

    // Filter by search term if provided
    let filteredProfiles = profiles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProfiles = profiles.filter(profile => 
        profile.bio?.toLowerCase().includes(searchLower) ||
        profile.city.toLowerCase().includes(searchLower)
      );
    }

    // Get user data for each profile
    const profilesWithUsers = await Promise.all(
      filteredProfiles.map(async (profile) => {
        const user = await userRepository.findById(profile.userId);
        return {
          id: profile.profileId,
          user: user ? {
            id: user.userId,
            phone: user.phone,
            first_name: user.firstName,
            last_name: user.lastName,
            full_name: `${user.firstName} ${user.lastName}`,
            avatar: user.avatar,
            is_phone_verified: user.isPhoneVerified
          } : null,
          categories: profile.categories,
          skills: profile.skills,
          bio: profile.bio,
          experience_years: profile.experienceYears,
          hourly_rate: profile.hourlyRate,
          city: profile.city,
          is_verified: profile.isVerified,
          is_available: profile.isAvailable,
          rating: profile.rating,
          reviews_count: profile.reviewsCount,
          completed_orders: profile.completedOrders,
          created_at: profile.createdAt
        };
      })
    );

    const response = formatPaginatedResponse(profilesWithUsers, profilesWithUsers.length, pageNum, limit);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
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
