interface LogContext {
    userId?: number;
    username?: string;
    action?: string;
    courseId?: number;
    error?: Error;
    [key: string]: any;
}

function formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

export function logInfo(message: string, context?: LogContext): void {
    console.log(formatMessage('info', message, context));
}

export function logWarn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
}

export function logError(message: string, error?: Error, context?: LogContext): void {
    const fullContext = { ...context, error, errorMessage: error?.message, stack: error?.stack };
    console.error(formatMessage('error', message, fullContext));
}

export function logDebug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
        console.log(formatMessage('debug', message, context));
    }
}
