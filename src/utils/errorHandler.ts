import { BotContext } from '../types';
import { logger } from './logger';
import { config } from '../config';
import { localizationService } from '@/services/LocalizationService';

/**
 * Handle user-facing errors with appropriate messages
 */
export async function handleUserError(
    ctx: BotContext,
    error: Error,
    userMessage: string = localizationService.t('errors.general.somethingWrong'),
    context?: Record<string, any>,
): Promise<void> {
    logger.error(
        {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            ...context,
            error,
        },
        'User error occurred',
    );

    try {
        await ctx.reply(userMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: localizationService.t('buttons.backToHome'), callback_data: 'back_to_courses' }],
                    ...(config.telegram.supportUrl
                        ? [[{ text: localizationService.t('buttons.contactSupport'), url: config.telegram.supportUrl }]]
                        : []),
                ],
            },
        });
    } catch (replyError) {
        logger.error(
            {
                ...context,
                error: replyError,
            },
            'Failed to send error message to user',
        );
    }
}

/**
 * Handle system errors (non-user facing)
 */
export function handleSystemError(error: Error, context?: Record<string, any>): void {
    logger.error(
        {
            ...context,
            error,
        },
        'System error occurred',
    );
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            logger.warn({
                error: lastError,
                attempt,
                maxRetries,
            }, `Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`);

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}
