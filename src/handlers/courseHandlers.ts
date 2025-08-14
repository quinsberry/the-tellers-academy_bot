import { BotContext } from '../types';
import { coursesService } from '@/services/CoursesService';
import { logError, logWarn } from '../utils/logger';
import {
    generateWelcomeMessage,
    generateCourseKeyboard,
    generateCourseDetails,
    generateCourseDetailKeyboard,
    generateBackToCourseKeyboard,
} from '../messages/courseMessages';

/**
 * Show welcome message and course list
 */
export async function showWelcomeAndCourses(ctx: BotContext, edit = false): Promise<void> {
    ctx.session.step = 'start';

    try {
        const courses = coursesService.getAllCourses();

        if (courses.length === 0) {
            const errorMsg = 'Sorry, no courses are currently available. Please check back later!';
            if (edit) {
                await ctx.editMessageText(errorMsg);
            } else {
                await ctx.reply(errorMsg);
            }
            return;
        }

        const message = generateWelcomeMessage(courses);
        const keyboard = generateCourseKeyboard(courses);

        const replyMarkup = {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        };

        if (edit) {
            await ctx.editMessageText(message, { ...replyMarkup, parse_mode: 'Markdown' });
        } else {
            await ctx.reply(message, { ...replyMarkup, parse_mode: 'Markdown' });
        }
    } catch (error) {
        logError('Error loading courses', error as Error);
        const errorMsg = 'Sorry, there was an error loading the courses. Please try again later.';
        if (edit) {
            await ctx.editMessageText(errorMsg);
        } else {
            await ctx.reply(errorMsg);
        }
    }
}

/**
 * Handle course selection and show course details
 */
export async function handleCourseSelection(ctx: BotContext, courseId: number): Promise<void> {
    try {
        const course = coursesService.getCourseById(courseId);

        if (!course) {
            await ctx.answerCallbackQuery('Course not found');
            return;
        }

        ctx.session.selectedCourseId = courseId;
        ctx.session.step = 'course_detail';

        const message = generateCourseDetails(course);
        const keyboard = generateCourseDetailKeyboard(courseId);

        await ctx.editMessageText(message, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });

        try {
            await ctx.answerCallbackQuery();
        } catch (error) {
            logWarn('Callback query already expired, continuing', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
            });
        }
    } catch (error) {
        logError('Error showing course details', error as Error, {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId,
        });
        try {
            await ctx.answerCallbackQuery('Error loading course details');
        } catch (callbackError) {
            logWarn('Callback query already expired, continuing', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
            });
        }
    }
}

/**
 * Handle back to courses action
 */
export async function handleBackToCourses(ctx: BotContext): Promise<void> {
    try {
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.log('⚠️ Callback query already expired, continuing...');
    }
    await showWelcomeAndCourses(ctx, true);
}

/**
 * Handle buy course action - start data collection
 */
export async function handleBuyCourse(ctx: BotContext): Promise<void> {
    ctx.session.step = 'entering_email';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.editMessageText('📧 Please enter your email address:', {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });

    try {
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.log('⚠️ Callback query already expired, continuing...');
    }
}
