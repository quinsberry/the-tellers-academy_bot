import { Context, SessionFlavor } from 'grammy';

export interface UserSession {
    step: 'start' | 'course_detail' | 'entering_email' | 'entering_name' | 'entering_position' | 'completed';
    selectedCourseId?: number;
    email?: string;
    name?: string;
    workPosition?: string;
    sessionToken?: string;
    createdAt?: string;
}

// Extend the context with session data
export type BotContext = Context & SessionFlavor<UserSession>;
