import { Context, SessionFlavor } from 'grammy';
import { SupportedLanguage } from './services/LocalizationService';

export interface UserSession {
    step: 'start' | 'course_detail' | 'entering_email' | 'entering_name' | 'entering_position' | 'selecting_bank' | 'completed';
    selectedCourseId?: number;
    email?: string;
    name?: string;
    workPosition?: string;
    selectedBank?: 'privatbank' | 'monobank';
    sessionToken?: string;
    createdAt?: string;
    language?: SupportedLanguage;
}

// Extend the context with session data
export type BotContext = Context & SessionFlavor<UserSession>;
