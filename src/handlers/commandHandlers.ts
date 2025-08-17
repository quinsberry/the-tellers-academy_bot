import { BotContext } from '../types';
import { showWelcomeAndCourses } from './courseHandlers';
import { handleUserError } from '../utils/errorHandler';
import { localizationService } from '@/services/LocalizationService';

/**
 * Handle /start command
 */
export async function handleStart(ctx: BotContext): Promise<void> {
    try {
        await showWelcomeAndCourses(ctx);
    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.startBot'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            operation: 'start_command',
        });
    }
}

/**
 * Handle /help command
 */
export async function handleHelp(ctx: BotContext): Promise<void> {
    try {
        await ctx.reply(
            '📚 Tellers Agency Academy Help\n\n' +
                '• /start - Start the bot and see course list\n' +
                '• /help - Show this help message\n\n' +
                'Simply select a course to view details and purchase!',
        );
    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.showHelp'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            operation: 'help_command',
        });
    }
}
