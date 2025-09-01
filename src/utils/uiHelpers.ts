import { BotContext } from '../types';

/**
 * Show loading state while processing
 */
export async function withLoadingState<T>(
    ctx: BotContext,
    loadingMessage: string,
    operation: () => Promise<T>
): Promise<T> {
    // Send loading message
    const loadingMsg = await ctx.reply(loadingMessage);
    
    try {
        const result = await operation();
        // Delete loading message
        await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
        return result;
    } catch (error) {
        // Delete loading message even on error
        try {
            await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
        } catch (deleteError) {
            // Ignore deletion errors
        }
        throw error;
    }
}

/**
 * Create progress indicator for multi-step processes
 */
export function createProgressIndicator(currentStep: number, totalSteps: number, stepName: string): string {
    const progressBar = '▓'.repeat(currentStep) + '░'.repeat(totalSteps - currentStep);
    return `📋 *Step ${currentStep}/${totalSteps}*: ${stepName}\n${progressBar} ${Math.round((currentStep / totalSteps) * 100)}%\n\n`;
}

/**
 * Format currency with proper symbols
 */
export function formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
        USD: '$',
        UAH: '₴',
        EUR: '€',
        GBP: '£',
        PLN: 'zł',
    };

    const symbol = symbols[currency.toUpperCase()] || currency;
    return `${symbol}${amount}`;
}

/**
 * Create user-friendly error messages with context
 */
export function createContextualError(error: string, context: string, suggestions?: string[]): string {
    let message = `❌ ${error}\n\n📍 Context: ${context}`;
    
    if (suggestions && suggestions.length > 0) {
        message += '\n\n💡 Suggestions:\n' + suggestions.map(s => `• ${s}`).join('\n');
    }
    
    return message;
}

/**
 * Create help text with keyboard shortcuts
 */
export function createHelpText(): string {
    return (
        '📚 *How to use this bot:*\n\n' +
        '1️⃣ Browse available courses\n' +
        '2️⃣ Select a course to see details\n' +
        '3️⃣ Click "Buy" to start enrollment\n' +
        '4️⃣ Fill in your information\n' +
        '5️⃣ Complete payment via the link\n\n' +
        '⌨️ *Quick commands:*\n' +
        '• /start - View courses\n' +
        '• /help - Show this help\n\n' +
        '🆘 Need help? Contact our support team!'
    );
}

/**
 * Create confirmation message with details
 */
export function createConfirmationMessage(
    courseName: string,
    userEmail: string,
    userName: string,
    workPosition: string
): string {
    return (
        '✅ *Registration Confirmation*\n\n' +
        `📚 Course: *${courseName}*\n` +
        `👤 Name: *${userName}*\n` +
        `📧 Email: *${userEmail}*\n` +
        `💼 Position: *${workPosition}*\n\n` +
        '✅ Your information has been saved successfully!\n' +
        '💳 Please proceed with payment using the link below.'
    );
}
