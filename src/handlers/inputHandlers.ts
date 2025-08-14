import { BotContext } from '../types';
import { validateEmail, validateName, validateWorkPosition } from '../utils/validators';
import {
    generateBackToCourseKeyboard,
    generateSuccessMessage,
    generateFinalKeyboard,
} from '../messages/courseMessages';
import { coursesService } from '@/services/CoursesService';
import { sheetsService, UserData } from '@/services/SheetsService';

/**
 * Handle email input with validation
 */
export async function handleEmailInput(ctx: BotContext, email: string): Promise<void> {
    const validation = validateEmail(email);

    if (!validation.isValid) {
        if (validation.error?.includes('Did you mean')) {
            await ctx.reply(validation.error, { parse_mode: 'Markdown' });
        } else {
            await ctx.reply(validation.error!);
        }
        return;
    }

    ctx.session.email = validation.value!;
    ctx.session.step = 'entering_name';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.reply('👤 Please enter your full name:', {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}

/**
 * Handle name input with validation
 */
export async function handleNameInput(ctx: BotContext, name: string): Promise<void> {
    const validation = validateName(name);

    if (!validation.isValid) {
        await ctx.reply(validation.error!);
        return;
    }

    ctx.session.name = validation.value!;
    ctx.session.step = 'entering_position';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.reply('💼 Please enter your work position:', {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}

/**
 * Handle work position input with validation and save data
 */
export async function handlePositionInput(ctx: BotContext, position: string): Promise<void> {
    const validation = validateWorkPosition(position);

    if (!validation.isValid) {
        await ctx.reply(validation.error!);
        return;
    }

    ctx.session.workPosition = validation.value!;
    ctx.session.step = 'completed';

    // Save data to Google Sheets
    try {
        const course = coursesService.getCourseById(ctx.session.selectedCourseId!);
        if (!course) {
            throw new Error('Course not found');
        }

        const userData: UserData = {
            telegramUsername: ctx.from?.username || `${ctx.from?.first_name} ${ctx.from?.last_name}` || 'Unknown',
            email: ctx.session.email!,
            name: ctx.session.name!,
            workPosition: ctx.session.workPosition!,
            courseId: course.id,
            courseName: course.name,
            timestamp: new Date().toISOString(),
        };

        await sheetsService.saveUserData(userData);

        // Show success message with payment link
        const successMessage = generateSuccessMessage(course.payment_link);
        const keyboard = generateFinalKeyboard();

        await ctx.reply(successMessage, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });

        // Reset session
        ctx.session = { step: 'start' };
    } catch (error) {
        console.error('Error saving user data:', error);
        await ctx.reply(
            '❌ Sorry, there was an error saving your information. Please try again later.\n\n' +
                'Use /start to return to the course list.',
        );
    }
}

/**
 * Route text messages to appropriate handlers based on current step
 */
export async function handleTextMessage(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text?.trim();
    if (!text) return;

    switch (ctx.session.step) {
        case 'entering_email':
            await handleEmailInput(ctx, text);
            break;
        case 'entering_name':
            await handleNameInput(ctx, text);
            break;
        case 'entering_position':
            await handlePositionInput(ctx, text);
            break;
        default:
            await ctx.reply('Please use /start to begin or select an option from the menu.');
    }
}
