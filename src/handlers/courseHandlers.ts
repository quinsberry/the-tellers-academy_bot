import { BotContext } from '../types';
import { coursesService } from '@/services/CoursesService';
import { logger } from '@/utils/logger';
import { handleUserError } from '../utils/errorHandler';
import { InputFile } from 'grammy';
import path from 'node:path';
import fs from 'node:fs';
import { safeAnswerCallbackQuery, handleCallbackWithExpiration } from '../utils/callbackHelpers';
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
            try {
                await ctx.editMessageText(message.text, {
                    ...replyMarkup,
                    entities: message.entities,
                });
            } catch (editError) {
                // If editing fails (e.g., trying to edit a photo message), delete and send new message
                try {
                    await ctx.deleteMessage();
                    await ctx.reply(message.text, {
                        ...replyMarkup,
                        entities: message.entities,
                    });
                } catch (deleteError) {
                    // Last resort: send a new message
                    await ctx.reply(message.text, {
                        ...replyMarkup,
                        entities: message.entities,
                    });
                }
            }
        } else {
            await ctx.reply(message.text, {
                ...replyMarkup,
                entities: message.entities,
            });
        }
    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('course.errorLoading'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            operation: 'load_courses',
        });
    }
}

/**
 * Handle course selection and show course details
 */
export async function handleCourseSelection(ctx: BotContext, courseId: number): Promise<void> {
    await handleCallbackWithExpiration(
        ctx,
        async (ctx) => {
            const course = coursesService.getCourseById(courseId);

            if (!course) {
                await safeAnswerCallbackQuery(ctx, localizationService.t('course.notFound'));
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

            await safeAnswerCallbackQuery(ctx);
        },
        // Refresh action for expired callbacks
        async () => {
            await showWelcomeAndCourses(ctx, true);
        },
    ).catch(async (error) => {
        await handleUserError(ctx, error as Error, localizationService.t('course.errorLoadingDetails'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId,
            operation: 'load_course_details',
        });
    });
}

/**
 * Handle back to courses action
 */
export async function handleBackToCourses(ctx: BotContext): Promise<void> {
    await handleCallbackWithExpiration(
        ctx,
        async (ctx) => {
            await safeAnswerCallbackQuery(ctx);

            // Reset session when going back to courses
            ctx.session = { step: 'start' };
            await showWelcomeAndCourses(ctx, true);
        },
        // Refresh action for expired callbacks
        async () => {
            ctx.session = { step: 'start' };
            await showWelcomeAndCourses(ctx, false); // Send new message instead of editing
        },
    );
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

        // Get QR code path from course data
        const qrCodePath = course.payment?.privatbank?.qr_code;

        if (qrCodePath && qrCodePath.startsWith('./images/')) {
            // Resolve the QR code file path (remove the ./ prefix and build from src directory)
            const cleanPath = qrCodePath.replace('./', '');
            const fullQrPath = path.join(__dirname, '..', cleanPath);

            // Check if QR code file exists
            if (fs.existsSync(fullQrPath)) {
                try {
                    // Delete the previous message and send a new one with photo
                    await ctx.deleteMessage();

                    // Send photo with QR code
                    await ctx.replyWithPhoto(new InputFile(fullQrPath), {
                        caption: paymentMessage.text,
                        caption_entities: paymentMessage.entities,
                        reply_markup: {
                            inline_keyboard: keyboard,
                        },
                    });
                } catch (deleteError) {
                    // If deletion fails, fall back to editing message text
                    await ctx.editMessageText(paymentMessage.text, {
                        entities: paymentMessage.entities,
                        reply_markup: {
                            inline_keyboard: keyboard,
                        },
                        link_preview_options: {
                            is_disabled: true,
                        },
                    });
                }
            } else {
                // QR code file doesn't exist, fall back to text message
                await ctx.editMessageText(paymentMessage.text, {
                    entities: paymentMessage.entities,
                    reply_markup: {
                        inline_keyboard: keyboard,
                    },
                    link_preview_options: {
                        is_disabled: true,
                    },
                });
            }
        } else {
            // No QR code specified, use text message
            await ctx.editMessageText(paymentMessage.text, {
                entities: paymentMessage.entities,
                reply_markup: {
                    inline_keyboard: keyboard,
                },
                link_preview_options: {
                    is_disabled: true,
                },
            });
        }

        try {
            await ctx.answerCallbackQuery();
        } catch (error) {}
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
        } catch (error) {}
    } catch (error) {
        logger.error(error as Error, 'Error handling Monobank selection');
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

            // Handle case where we might be coming from a photo message
            try {
                await showWelcomeAndCourses(ctx, true);
            } catch (editError) {
                // If editing fails, delete the photo message and send a new text message
                try {
                    await ctx.deleteMessage();
                    await showWelcomeAndCourses(ctx, false);
                } catch (deleteError) {
                    // Last resort: just send a new message
                    await showWelcomeAndCourses(ctx, false);
                }
            }
            return;
        }

        ctx.session.step = 'selecting_bank';
        ctx.session.selectedBank = null;

        const bankSelectionMessage = generateBankSelectionMessage();
        const keyboard = generateBankSelectionKeyboard(ctx.session.selectedCourseId);

        try {
            // Try to edit message text first
            await ctx.editMessageText(bankSelectionMessage.text, {
                entities: bankSelectionMessage.entities,
                reply_markup: {
                    inline_keyboard: keyboard,
                },
            });
        } catch (editError) {
            // If editing fails (e.g., trying to edit a photo message), delete and send new message
            try {
                await ctx.deleteMessage();
                await ctx.reply(bankSelectionMessage.text, {
                    entities: bankSelectionMessage.entities,
                    reply_markup: {
                        inline_keyboard: keyboard,
                    },
                });
            } catch (deleteError) {
                // Last resort: send a new message
                await ctx.reply(bankSelectionMessage.text, {
                    entities: bankSelectionMessage.entities,
                    reply_markup: {
                        inline_keyboard: keyboard,
                    },
                });
            }
        }

        try {
            await ctx.answerCallbackQuery();
        } catch (error) {}
    } catch (error) {
        await handleUserError(ctx, error as Error, localizationService.t('errors.general.somethingWrong'), {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            courseId: ctx.session.selectedCourseId,
            operation: 'back_to_banks',
        });
    }
}
