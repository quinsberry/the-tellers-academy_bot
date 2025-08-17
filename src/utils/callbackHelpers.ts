import { BotContext } from '../types';
import { logWarn } from './logger';

/**
 * Safely answer callback query with proper error handling
 */
export async function safeAnswerCallbackQuery(
    ctx: BotContext, 
    text?: string, 
    options?: { show_alert?: boolean }
): Promise<void> {
    try {
        if (text && options?.show_alert) {
            await ctx.answerCallbackQuery({
                text,
                show_alert: true
            });
        } else if (text) {
            await ctx.answerCallbackQuery({
                text,
                show_alert: false
            });
        } else {
            await ctx.answerCallbackQuery();
        }
    } catch (error) {
        logWarn('Callback query failed (likely expired)', {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            errorMessage: (error as Error).message,
        });
    }
}

/**
 * Handle expired callback queries by refreshing the interface
 */
export async function handleExpiredCallback(
    ctx: BotContext,
    refreshAction: () => Promise<void>,
    fallbackMessage: string = 'This button has expired. Please start over.'
): Promise<void> {
    try {
        // Try to answer the callback query first
        await safeAnswerCallbackQuery(ctx, 'Button expired, refreshing...', { show_alert: false });
        
        // Try to refresh the interface
        await refreshAction();
    } catch (error) {
        logWarn('Failed to refresh expired callback', {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        
        // Last resort: send a new message
        try {
            await ctx.reply(fallbackMessage);
        } catch (replyError) {
            logWarn('Failed to send fallback message', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                errorMessage: replyError instanceof Error ? replyError.message : String(replyError),
            });
        }
    }
}

/**
 * Check if a callback query is likely expired based on message date
 */
export function isCallbackLikelyExpired(ctx: BotContext, maxAgeMinutes: number = 120): boolean {
    if (!ctx.callbackQuery?.message?.date) {
        return false;
    }
    
    const messageDate = new Date(ctx.callbackQuery.message.date * 1000);
    const now = new Date();
    const ageMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
}

/**
 * Enhanced callback handler that detects and handles expired callbacks
 */
export async function handleCallbackWithExpiration<T>(
    ctx: BotContext,
    handler: (ctx: BotContext) => Promise<T>,
    refreshAction?: () => Promise<void>
): Promise<T | void> {
    try {
        // Check if callback is likely expired
        if (isCallbackLikelyExpired(ctx)) {
            logWarn('Detected likely expired callback', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                messageAge: ctx.callbackQuery?.message?.date,
            });
            
            if (refreshAction) {
                await handleExpiredCallback(ctx, refreshAction, 'This button has expired. Interface refreshed.');
                return;
            }
        }
        
        return await handler(ctx);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a callback query expiration error
        if (errorMessage.includes('query is too old') || 
            errorMessage.includes('callback query') ||
            errorMessage.includes('expired')) {
            
            logWarn('Callback query expired during handling', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                errorMessage: errorMessage,
            });
            
            if (refreshAction) {
                await handleExpiredCallback(ctx, refreshAction, 'Button expired. Please try again.');
                return;
            }
        }
        
        // Re-throw if it's not an expiration error
        throw error;
    }
}
