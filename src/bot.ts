import { Bot, session } from 'grammy';
import { config } from './config';
import { BotContext, UserSession } from './types';
import { handleStart, handleHelp } from './handlers/commandHandlers';
import { handleCourseSelection, handleBackToCourses, handleBuyCourse } from './handlers/courseHandlers';
import { handleTextMessage, handleRetrySaveData } from './handlers/inputHandlers';
import { BUY_COURSE_KEY, BACK_TO_COURSES_KEY, RETRY_SAVE_DATA_KEY } from './messages/courseMessages';

// Create bot instance
const bot = new Bot<BotContext>(config.telegram.botToken);

// Session middleware
function initial(): UserSession {
  return { step: 'start' };
}

bot.use(session({ initial }));

// Command handlers
bot.command('start', handleStart);
bot.command('help', handleHelp);

// Callback query handlers
bot.callbackQuery(/^course_(\d+)$/, async (ctx) => {
  const courseId = parseInt(ctx.match[1]);
  await handleCourseSelection(ctx, courseId);
});

bot.callbackQuery(BACK_TO_COURSES_KEY, handleBackToCourses);
bot.callbackQuery(BUY_COURSE_KEY, handleBuyCourse);
bot.callbackQuery(RETRY_SAVE_DATA_KEY, handleRetrySaveData);

// Text message handlers
bot.on('message:text', handleTextMessage);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

export { bot };