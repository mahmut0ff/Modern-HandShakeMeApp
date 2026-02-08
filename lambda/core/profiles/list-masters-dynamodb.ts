import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { MasterProfileRepository } from '../shared/repositories/master-profile.repository';
import { logger } from '../shared/utils/logger';

const masterProfileRepository = new MasterProfileRepository();

async function listMastersHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    logger.info('List masters request', { queryParams: event.queryStringParameters });

    const queryParams = event.queryStringParameters || {};

    // Parse query parameters
    const filters = {
        category_id: queryParams.category_id ? parseInt(queryParams.category_id) : undefined,
        skill_id: queryParams.skill_id ? parseInt(queryParams.skill_id) : undefined,
        city: queryParams.city,
        min_rating: queryParams.min_rating ? parseFloat(queryParams.min_rating) : undefined,
        max_hourly_rate: queryParams.max_hourly_rate ? parseFloat(queryParams.max_hourly_rate) : undefined,
        is_verified: queryParams.is_verified === 'true',
        is_available: queryParams.is_available === 'true',
        search: queryParams.search,
        ordering: queryParams.ordering || '-rating',
        page: queryParams.page ? parseInt(queryParams.page) : 1,
        page_size: queryParams.page_size ? parseInt(queryParams.page_size) : 20,
        with_portfolio: queryParams.with_portfolio === 'true' || queryParams.with_portfolio === undefined, // Default to true
    };

    try {
        // Get all master profiles
        const masters = await masterProfileRepository.listMasters(filters);

        logger.info('Masters retrieved successfully', { count: masters.length });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: masters,
                count: masters.length,
            }),
        };
    } catch (error) {
        logger.error('Failed to list masters', error);
        throw error;
    }
}

export const handler = withErrorHandler(listMastersHandler);
