import { config } from '../config';

/**
 * Format course date consistently in UTC (assuming course dates are stored as YYYY-MM-DD)
 */
export const formatCourseDate = (dateString: string): string => {
    // For course dates (YYYY-MM-DD format), treat as UTC to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Create date in local timezone but treat as intended date
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Force UTC to prevent timezone shifts
    });
};

/**
 * Format timestamp in a specific timezone (default from config)
 */
export const formatTimestamp = (timestamp: string, timezone: string = config.app.timezone): string => {
    const date = new Date(timestamp);
    
    // Format in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value;
    
    return `${day}.${month}.${year}, ${hour}:${minute} ${dayPeriod?.toUpperCase()}`;
};

/**
 * Format timestamp in UTC for consistent display
 */
export const formatTimestampUTC = (timestamp: string): string => {
    return formatTimestamp(timestamp, 'UTC');
};

/**
 * Get current timestamp in ISO format (UTC)
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};