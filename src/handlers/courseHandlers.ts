import { BotContext } from '../types';
import { coursesService } from '@/services/CoursesService';
import { logError, logWarn } from '../utils/logger';
import { handleUserError } from '../utils/errorHandler';
import {
    generateWelcomeMessage,
    generateCourseKeyboard,
    generateCourseDetails,
    generateCourseDetailKeyboard,
    generateBackToCourseKeyboard,
    generateBankSelectionMessage,
    generateBankSelectionKeyboard,
    generateBankPaymentMessage,
    generateFinalKeyboard,
} from '../messages/courseMessages';
import { localizationService } from '@/services/LocalizationService';

/**
 * Show welcome message and course list
 */
export async function showWelcomeAndCourses(ctx: BotContext, edit = false): Promise<void> {
    ctx.session.step = 'start';

    try {
        const courses = coursesService.getAllCourses();

        if (courses.length === 0) {
            const errorMsg = localizationService.t('course.noCoursesAvailable');
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
            await ctx.editMessageText(message.text, {
                ...replyMarkup,
                entities: message.entities,
            });
        } else {
            await ctx.reply(message.text, {
                ...replyMarkup,
                entities: message.entities,
            });
        }
    } catch (error) {
        await handleUserError(
            ctx,
            error as Error,
            localizationService.t('course.errorLoading'),
            {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                operation: 'load_courses',
            },
        );
    }
}

/**
 * Handle course selection and show course details
 */
export async function handleCourseSelection(ctx: BotContext, courseId: number): Promise<void> {
    try {
        const course = coursesService.getCourseById(courseId);

        if (!course) {
            await ctx.answerCallbackQuery(localizationService.t('course.notFound'));
            return;
        }

        ctx.session.selectedCourseId = courseId;
        ctx.session.step = 'course_detail';

        const message = generateCourseDetails(course);
        const keyboard = generateCourseDetailKeyboard(courseId);

        await ctx.editMessageText(message.text, {
            entities: message.entities,
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
        await handleUserError(
            ctx,
            error as Error,
            localizationService.t('course.errorLoadingDetails'),
            {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                courseId,
                operation: 'load_course_details',
            },
        );
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
    
    // Reset session when going back to courses
    ctx.session = { step: 'start' };
    await showWelcomeAndCourses(ctx, true);
}

/**
 * Handle buy course action - start data collection
 */
export async function handleBuyCourse(ctx: BotContext): Promise<void> {
    ctx.session.step = 'entering_name';

    const keyboard = generateBackToCourseKeyboard(ctx.session.selectedCourseId!);

    await ctx.editMessageText(localizationService.t('form.enterName'), {
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

/**
 * Handle bank selection (PrivatBank)
 */
export async function handlePrivatBankSelection(ctx: BotContext): Promise<void> {
    try {
        const course = coursesService.getCourseById(ctx.session.selectedCourseId!);
        
        if (!course) {
            await ctx.answerCallbackQuery(localizationService.t('course.notFound'));
            return;
        }

        ctx.session.selectedBank = 'privatbank';
        ctx.session.step = 'completed';

        const paymentMessage = generateBankPaymentMessage('privatbank', course);
        const keyboard = generateFinalKeyboard();

        await ctx.editMessageText(paymentMessage.text, {
            entities: paymentMessage.entities,
            reply_markup: {
                inline_keyboard: keyboard,
            },
            link_preview_options: {
                is_disabled: true,
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
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.somethingWrong'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'select_privatbank',
        });
    }
}

/**
 * Handle bank selection (Monobank)
 */
export async function handleMonoBankSelection(ctx: BotContext): Promise<void> {
    try {
        const course = coursesService.getCourseById(ctx.session.selectedCourseId!);
        
        if (!course) {
            await ctx.answerCallbackQuery(localizationService.t('course.notFound'));
            return;
        }

        ctx.session.selectedBank = 'monobank';
        ctx.session.step = 'completed';

        const paymentMessage = generateBankPaymentMessage('monobank', course);
        const keyboard = generateFinalKeyboard();

        await ctx.editMessageText(paymentMessage.text, {
            entities: paymentMessage.entities,
            reply_markup: {
                inline_keyboard: keyboard,
            },
            link_preview_options: {
                is_disabled: true,
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
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.somethingWrong'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'select_monobank',
        });
    }
}

/**
 * Handle back to banks action
 */
export async function handleBackToBanks(ctx: BotContext): Promise<void> {
    try {
        if (!ctx.session.selectedCourseId) {
            await ctx.answerCallbackQuery(localizationService.t('course.notFound'));
            await showWelcomeAndCourses(ctx, true);
            return;
        }

        ctx.session.step = 'selecting_bank';
        ctx.session.selectedBank = undefined;

        const bankSelectionMessage = generateBankSelectionMessage();
        const keyboard = generateBankSelectionKeyboard(ctx.session.selectedCourseId);

        await ctx.editMessageText(bankSelectionMessage.text, {
            entities: bankSelectionMessage.entities,
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
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.somethingWrong'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'back_to_banks',
        });
    }
}
