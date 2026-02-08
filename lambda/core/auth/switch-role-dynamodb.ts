import type { APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../shared/repositories/user.repository';
import { generateTokenPair } from '../shared/services/auth-token.service';
import { success, badRequest } from '../shared/utils/response';
import { withAuth, AuthenticatedEvent } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { logger } from '../shared/utils/logger';

async function switchRoleHandler(event: AuthenticatedEvent): Promise<APIGatewayProxyResult> {
    const { userId } = event.auth;

    logger.info('Role switch request received', { userId });

    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);

    if (!user) {
        return badRequest('User not found');
    }

    // Toggle role
    const newRole = user.role === 'MASTER' ? 'CLIENT' : 'MASTER';

    const updatedUser = await userRepo.update(userId, {
        role: newRole
    });

    logger.info('User role updated', { userId, oldRole: user.role, newRole });

    // Issue new tokens with the updated role
    const tokens = generateTokenPair({
        userId: updatedUser.id,
        email: updatedUser.email || updatedUser.phone || updatedUser.telegramId || '',
        role: updatedUser.role,
        phone: updatedUser.phone,
        isVerified: updatedUser.isPhoneVerified,
    });

    return success({
        tokens: {
            access: tokens.accessToken,
            refresh: tokens.refreshToken,
        },
        user: {
            id: updatedUser.id,
            phone: updatedUser.phone,
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fullName: updatedUser.name,
            telegramId: updatedUser.telegramId,
            telegramUsername: updatedUser.telegramUsername,
            avatar: updatedUser.avatar,
            isPhoneVerified: updatedUser.isPhoneVerified,
            createdAt: updatedUser.createdAt,
        },
        message: `Role switched to ${newRole.toLowerCase()}`,
    });
}

export const handler = withErrorHandler(withAuth(switchRoleHandler));
