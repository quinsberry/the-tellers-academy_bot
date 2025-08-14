import { BotContext } from '../types';
import { logError, logWarn } from './logger';
import { config } from '../config';

/**
 * Handle user-facing errors with appropriate messages
 */
export async function handleUserError(
    ctx: BotContext,
    error: Error,
    userMessage: string = '❌ Something went wrong. Please try again.',
    context?: Record<string, any>,
): Promise<void> {
    logError('User error occurred', error, {
        userId: ctx.from?.id,
        username: ctx.from?.username,
        ...context,
    });

    try {
        await ctx.reply(userMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔄 Try Again', callback_data: 'retry_last_action' }],
                    [{ text: '🏠 Back to Home', callback_data: 'back_to_courses' }],
                    ...(config.telegram.supportUrl
                        ? [[{ text: '📞 Contact Support', url: config.telegram.supportUrl }]]
                        : []),
                ],
            },
        });
    } catch (replyError) {
        logError('Failed to send error message to user', replyError as Error, context);
    }
}

/**
 * Handle system errors (non-user facing)
 */
export function handleSystemError(error: Error, context?: Record<string, any>): void {
    logError('System error occurred', error, context);

    // In production, you might want to send alerts to monitoring service
    if (config.app.nodeEnv === 'production') {
        // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
    }
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
            logWarn(`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`, {
                error: lastError,
                attempt,
                maxRetries,
            });

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}
