import { BotContext } from '../types';
import { showWelcomeAndCourses } from './courseHandlers';

/**
 * Handle /start command
 */
export async function handleStart(ctx: BotContext): Promise<void> {
    await showWelcomeAndCourses(ctx);
}

/**
 * Handle /help command
 */
export async function handleHelp(ctx: BotContext): Promise<void> {
    await ctx.reply(
        '📚 Tellers Agency Academy Help\n\n' +
            '• /start - Start the bot and see course list\n' +
            '• /help - Show this help message\n\n' +
            'Simply select a course to view details and purchase!',
    );
}
