import { BotContext } from '../types';
import { logger } from './logger';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<number, { count: number; resetTime: number }>();

/**
 * Rate limiting for bot users
 */
export function checkRateLimit(
    userId: number,
    maxRequests: number = 100,
    windowMs: number = 60000, // 1 minute
): boolean {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        // Reset or initialize limit
        rateLimitStore.set(userId, {
            count: 1,
            resetTime: now + windowMs,
        });
        return true;
    }

    if (userLimit.count >= maxRequests) {
        logger.warn(
            {
                userId,
                count: userLimit.count,
                maxRequests,
            },
            'Rate limit exceeded',
        );
        return false;
    }

    userLimit.count++;
    return true;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeUserInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .substring(0, 1000); // Limit length
}

/**
 * Validate user permissions for sensitive operations
 */
export function validateUserPermissions(ctx: BotContext): boolean {
    // Basic validation - in production, implement proper user roles
    if (!ctx.from?.id) {
        logger.error(new Error('Missing user ID'), 'Invalid user context');
        return false;
    }

    // Check if user is banned (implement your ban logic)
    const bannedUsers = process.env.BANNED_USER_IDS?.split(',').map(Number) || [];
    if (bannedUsers.includes(ctx.from.id)) {
        logger.warn({ userId: ctx.from.id }, 'Banned user attempted access');
        return false;
    }

    return true;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, any>): Record<string, any> {
    const masked = { ...data };

    // Mask email
    if (masked.email && typeof masked.email === 'string') {
        const [local, domain] = masked.email.split('@');
        masked.email = `${local.substring(0, 2)}***@${domain}`;
    }

    // Mask name
    if (masked.name && typeof masked.name === 'string') {
        const parts = masked.name.split(' ');
        masked.name = parts.map((part) => (part.length > 2 ? `${part.substring(0, 2)}***` : part)).join(' ');
    }

    // Remove sensitive fields
    delete masked.privateKey;
    delete masked.token;
    delete masked.password;

    return masked;
}
