import { BotContext } from '../types';
import { validateEmail, validateName, validateWorkPosition } from '../utils/validators';
import {
    generateBackToCourseKeyboard,
    generateSuccessMessage,
    generateFinalKeyboard,
    RETRY_SAVE_DATA_KEY,
    BACK_TO_COURSES_KEY,
} from '../messages/courseMessages';
import { coursesService } from '@/services/CoursesService';
import { sheetsService, UserData } from '@/services/SheetsService';
import { config } from '@/config';
import { getCurrentTimestamp } from '../utils/formatDates';

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
            timestamp: getCurrentTimestamp(),
        };

        await sheetsService.saveUserData(userData);

        // Show success message with payment link
        const successMessage = generateSuccessMessage(course.payment_link);
        const keyboard = generateFinalKeyboard();

        await ctx.reply(successMessage, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
            link_preview_options: {
                is_disabled: true,
            }
        });

        // Reset session
        ctx.session = { step: 'start' };
    } catch (error) {
        console.error('Error saving user data:', error);
        await ctx.reply(
            '❌ Sorry, there was an error saving your information to our system.\n\n' +
                "Don't worry, your data is still here! You can try again.",
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Try Again', callback_data: RETRY_SAVE_DATA_KEY }],
                        [{ text: '🏠 Back to courses', callback_data: BACK_TO_COURSES_KEY }],
                    ],
                },
            },
        );
    }
}

/**
 * Handle retry save data action
 */
export async function handleRetrySaveData(ctx: BotContext): Promise<void> {
    // Check if we have all the required data in the session
    if (!ctx.session.selectedCourseId || !ctx.session.email || !ctx.session.name || !ctx.session.workPosition) {
        try {
            await ctx.answerCallbackQuery();
        } catch (error) {
            console.log('⚠️ Callback query already expired, continuing...');
        }
        await ctx.editMessageText('❌ Session data is incomplete. Please start over.', {
            reply_markup: {
                inline_keyboard: [[{ text: '🏠 Back to courses', callback_data: BACK_TO_COURSES_KEY }]],
            },
        });
        return;
    }

    try {
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.log('⚠️ Callback query already expired, continuing...');
    }
    await ctx.editMessageText('🔄 Retrying to save your information...');

    // Retry the save operation
    try {
        const course = coursesService.getCourseById(ctx.session.selectedCourseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const userData: UserData = {
            telegramUsername: ctx.from?.username || `${ctx.from?.first_name} ${ctx.from?.last_name}` || 'Unknown',
            email: ctx.session.email,
            name: ctx.session.name,
            workPosition: ctx.session.workPosition,
            courseId: course.id,
            courseName: course.name,
            timestamp: getCurrentTimestamp(),
        };

        await sheetsService.saveUserData(userData);

        // Show success message with payment link
        const successMessage = generateSuccessMessage(course.payment_link);
        const keyboard = generateFinalKeyboard();

        await ctx.editMessageText(successMessage, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
            link_preview_options: {
                is_disabled: true,
            }
        });

        // Reset session
        ctx.session = { step: 'start' };
    } catch (error) {
        console.error('Error saving user data on retry:', error);
        await ctx.editMessageText(
            '❌ Still having trouble saving your information.\n\n' +
                'This might be a temporary issue with our system. Please try again in a few minutes.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Try Again', callback_data: RETRY_SAVE_DATA_KEY }],
                        [{ text: '🏠 Back to courses', callback_data: BACK_TO_COURSES_KEY }],
                        ...(config.telegram.supportUrl
                            ? [[{ text: '📞 Contact Support', url: config.telegram.supportUrl }]]
                            : []),
                    ],
                },
            },
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
