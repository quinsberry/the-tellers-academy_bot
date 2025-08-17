import { BotContext } from '../types';
import { validateEmail, validateName, validateWorkPosition } from '../utils/validators';
import { logWarn } from '../utils/logger';
import { handleUserError, withRetry } from '../utils/errorHandler';
import { sanitizeUserInput } from '../utils/security';
import {
    generateBackToCourseKeyboard,
    generateBankSelectionMessage,
    generateBankSelectionKeyboard,
    generateSuccessMessage,
    generateFinalKeyboard,
    BACK_TO_COURSES_KEY,
} from '../messages/courseMessages';
import { coursesService } from '@/services/CoursesService';
import { sheetsService, UserData } from '@/services/SheetsService';
import { getCurrentTimestamp } from '../utils/formatDates';
import { localizationService } from '@/services/LocalizationService';

/**
 * Handle email input with validation
 */
export async function handleEmailInput(ctx: BotContext, email: string): Promise<void> {
    // Sanitize input first
    const sanitizedEmail = sanitizeUserInput(email);
    const validation = validateEmail(sanitizedEmail);

    if (!validation.isValid) {
        if (validation.error?.includes('Did you mean')) {
            await ctx.reply(validation.error, { parse_mode: 'Markdown' });
        } else {
            await ctx.reply(validation.error!);
        }
        return;
    }

    ctx.session.email = validation.value!;
    ctx.session.step = 'entering_position';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.reply(localizationService.t('form.enterPosition'), {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}

/**
 * Handle name input with validation
 */
export async function handleNameInput(ctx: BotContext, name: string): Promise<void> {
    // Sanitize input first
    const sanitizedName = sanitizeUserInput(name);
    const validation = validateName(sanitizedName);

    if (!validation.isValid) {
        await ctx.reply(validation.error!);
        return;
    }

    ctx.session.name = validation.value!;
    ctx.session.step = 'entering_email';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.reply(localizationService.t('form.enterEmail'), {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}

/**
 * Handle work position input with validation and save data
 */
export async function handlePositionInput(ctx: BotContext, position: string): Promise<void> {
    // Sanitize input first
    const sanitizedPosition = sanitizeUserInput(position);
    const validation = validateWorkPosition(sanitizedPosition);

    if (!validation.isValid) {
        await ctx.reply(validation.error!);
        return;
    }

    ctx.session.workPosition = validation.value!;
    ctx.session.step = 'selecting_bank';

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

        await withRetry(() => sheetsService.saveUserData(userData), 2, 1000);

        // Show bank selection message
        const bankSelectionMessage = generateBankSelectionMessage();
        const keyboard = generateBankSelectionKeyboard(ctx.session.selectedCourseId!);

        await ctx.reply(bankSelectionMessage.text, {
            entities: bankSelectionMessage.entities,
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });

    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('errors.dataSaving.failed'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'save_user_data',
        });
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
            logWarn('Callback query already expired, continuing', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
            });
        }
        await ctx.editMessageText(localizationService.t('errors.dataSaving.incomplete'), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: localizationService.t('buttons.backToCourses'), callback_data: BACK_TO_COURSES_KEY }],
                ],
            },
        });
        return;
    }

    try {
        await ctx.answerCallbackQuery();
    } catch (error) {
        logWarn('Callback query already expired, continuing', {
            userId: ctx.from?.id,
            username: ctx.from?.username,
        });
    }
    await ctx.editMessageText(localizationService.t('errors.dataSaving.retrying'));

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

        await withRetry(() => sheetsService.saveUserData(userData), 2, 1000);

        // Show bank selection message
        ctx.session.step = 'selecting_bank';
        const bankSelectionMessage = generateBankSelectionMessage();
        const keyboard = generateBankSelectionKeyboard(ctx.session.selectedCourseId);

        await ctx.editMessageText(bankSelectionMessage.text, {
            entities: bankSelectionMessage.entities,
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('errors.dataSaving.stillTrouble'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'retry_save_user_data',
        });
    }
}

/**
 * Route text messages to appropriate handlers based on current step
 */
export async function handleTextMessage(ctx: BotContext): Promise<void> {
    const rawText = ctx.message?.text?.trim();
    if (!rawText) return;

    // Sanitize input for security
    const text = sanitizeUserInput(rawText);

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
            await ctx.reply(localizationService.t('errors.general.useStart'));
    }
}
