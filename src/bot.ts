import { Bot, session } from 'grammy';
import { config } from './config';
import { BotContext, UserSession } from './types';
import { handleSystemError } from './utils/errorHandler';
import { checkRateLimit, validateUserPermissions } from './utils/security';
import { handleStart, handleHelp } from './handlers/commandHandlers';
import { handleCourseSelection, handleBackToCourses, handleBuyCourse, handlePrivatBankSelection, handleMonoBankSelection, handleBackToBanks } from './handlers/courseHandlers';
import { handleTextMessage, handleRetrySaveData } from './handlers/inputHandlers';
import { BUY_COURSE_KEY, BACK_TO_COURSES_KEY, BACK_TO_BANKS_KEY, RETRY_SAVE_DATA_KEY, SELECT_PRIVATBANK_KEY, SELECT_MONOBANK_KEY } from './messages/courseMessages';
import { b, fmt, u } from '@grammyjs/parse-mode';
import { safeAnswerCallbackQuery } from './utils/callbackHelpers';
import { localizationService } from './services/LocalizationService';

// Create bot instance
const bot = new Bot<BotContext>(config.telegram.botToken);

// Session middleware
function initial(): UserSession {
    return {
        step: 'start',
        createdAt: new Date().toISOString(),
    };
}

bot.use(session({ initial }));

// Global callback query middleware for handling expired callbacks
bot.on('callback_query', async (ctx, next) => {
    // Check if callback query is too old (older than 2 hours)
    const messageDate = ctx.callbackQuery.message?.date;
    if (messageDate) {
        const ageMinutes = (Date.now() - messageDate * 1000) / (1000 * 60);
        if (ageMinutes > 120) { // 2 hours
            await safeAnswerCallbackQuery(
                ctx, 
                localizationService.t('errors.expiredCallback'), 
                { show_alert: true }
            );
            return; // Don't proceed to the actual handler
        }
    }
    
    await next();
});

// bot.

// Security middleware
bot.use(async (ctx, next) => {
    // Validate user permissions
    if (!validateUserPermissions(ctx)) {
        return; // User is banned or invalid
    }

    // Check rate limiting
    if (ctx.from?.id && !checkRateLimit(ctx.from.id, config.app.maxRequestsPerMinutePerUser, 60_000)) {
        await ctx.reply('⚠️ Too many requests. Please wait a moment before trying again.');
        return;
    }

    await next();
});

bot.command("demo", async (ctx) => {
	// Using return values of fmt
	const combined = fmt`${b}bolded${b} ${ctx.msg.text} ${u}underlined${u}`;
	await ctx.reply(combined.text, { entities: combined.entities });
});

// Command handlers
bot.command('start', handleStart);
bot.command('help', handleHelp);

// Callback query handlers
bot.callbackQuery(/^course_(\d+)$/, async (ctx) => {
    const courseId = parseInt(ctx.match[1] ?? '0');
    await handleCourseSelection(ctx, courseId);
});

bot.callbackQuery(BACK_TO_COURSES_KEY, handleBackToCourses);
bot.callbackQuery(BACK_TO_BANKS_KEY, handleBackToBanks);
bot.callbackQuery(BUY_COURSE_KEY, handleBuyCourse);
bot.callbackQuery(RETRY_SAVE_DATA_KEY, handleRetrySaveData);
bot.callbackQuery(SELECT_PRIVATBANK_KEY, handlePrivatBankSelection);
bot.callbackQuery(SELECT_MONOBANK_KEY, handleMonoBankSelection);

// Text message handlers
bot.on('message:text', handleTextMessage);

// Error handler
bot.catch((err) => {
    handleSystemError(err.error as Error, {
        userId: err.ctx?.from?.id,
        username: err.ctx?.from?.username,
        operation: 'bot_error',
        updateType: err.ctx?.update ? Object.keys(err.ctx.update)[0] : 'unknown',
    });
});

export { bot };
