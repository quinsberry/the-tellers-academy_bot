import fs from 'node:fs';
import path from 'node:path';
import { BotContext } from '../types';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { getSrcDir } from '@/utils/paths';

// Supported languages
export type SupportedLanguage = 'en' | 'ua';

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = config.app.defaultLanguage as SupportedLanguage;

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: '🇺🇸 English',
    ua: '🇺🇦 Українська',
};

// Language display names
export const LANGUAGE_LOCALES: Record<SupportedLanguage, Intl.LocalesArgument> = {
    en: 'en-US',
    ua: 'uk-UA',
};

// Telegram language code mapping
const TELEGRAM_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
    en: 'en',
    uk: 'ua',
};

export class LocalizationService {
    private translationCache = new Map<SupportedLanguage, any>();

    init() {
        Object.keys(LANGUAGE_NAMES).forEach((lang) => {
            this.loadTranslation(lang as SupportedLanguage);
        });
        console.log(`✅ Translations loaded for languages: ${Object.keys(LANGUAGE_NAMES).join(', ')}`);
    }

    /**
     * Load translation file for a specific language
     */
    private loadTranslation(language: SupportedLanguage): any {
        if (this.translationCache.has(language)) {
            return this.translationCache.get(language);
        }

        try {
            const filePath = path.join(getSrcDir(), 'locales', `${language}.json`);
            const content = fs.readFileSync(filePath, 'utf-8');
            const translation = JSON.parse(content);

            this.translationCache.set(language, translation);

            return translation;
        } catch (error) {
            logger.warn(error as Error, `Failed to load translation for ${language}, falling back to ${DEFAULT_LANGUAGE}`);

            // Fallback to default language
            if (language !== DEFAULT_LANGUAGE) {
                return this.loadTranslation(DEFAULT_LANGUAGE);
            }

            throw new Error(`Failed to load default translation: ${error}`);
        }
    }

    /**
     * Get nested property from object using dot notation
     */
    private getNestedProperty(obj: any, path: string): string | undefined {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Replace placeholders in text with provided values
     */
    private replacePlaceholders(text: string, params: Record<string, string | number> = {}): string {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? String(params[key]) : match;
        });
    }

    /**
     * Detect user's language from Telegram context
     */
    detectUserLanguage(ctx: BotContext): SupportedLanguage {
        // 1. Check if language is already set in session
        if (ctx.session.language) {
            return ctx.session.language as SupportedLanguage;
        }

        // 2. Try to detect from Telegram language code
        const telegramLangCode = ctx.from?.language_code;
        if (telegramLangCode && TELEGRAM_LANGUAGE_MAP[telegramLangCode]) {
            const detectedLang = TELEGRAM_LANGUAGE_MAP[telegramLangCode];
            // Save to session for future use
            ctx.session.language = detectedLang;
            return detectedLang;
        }

        // 3. Fallback to default language
        ctx.session.language = DEFAULT_LANGUAGE;
        return DEFAULT_LANGUAGE;
    }

    /**
     * Set user's language preference
     */
    setUserLanguage(ctx: BotContext, language: SupportedLanguage): void {
        ctx.session.language = language;
    }

    /**
     * Main translation function
     */
    t(key: string, params: Record<string, string | number> = {}): string {
        const language = DEFAULT_LANGUAGE;
        const translation = this.loadTranslation(language);

        const text = this.getNestedProperty(translation, key);

        if (text === undefined) {
            console.warn(`Translation key "${key}" not found for language "${language}"`);

            // Try fallback to default language if not already using it
            if (language !== DEFAULT_LANGUAGE) {
                const defaultTranslation = this.loadTranslation(DEFAULT_LANGUAGE);
                const fallbackText = this.getNestedProperty(defaultTranslation, key);

                if (fallbackText) {
                    return this.replacePlaceholders(fallbackText, params);
                }
            }

            // Return key if no translation found
            return `[${key}]`;
        }

        return this.replacePlaceholders(text, params);
    }

    /**
     * Translation function for specific language (useful for admin messages)
     */
    tLang(language: SupportedLanguage, key: string, params: Record<string, string | number> = {}): string {
        const translation = this.loadTranslation(language);
        const text = this.getNestedProperty(translation, key);

        if (text === undefined) {
            logger.warn(`Translation key "${key}" not found for language "${language}"`);
            return `[${key}]`;
        }

        return this.replacePlaceholders(text, params);
    }

    /**
     * Get available languages for language selection menu
     */
    getAvailableLanguages(): Array<{ code: SupportedLanguage; name: string }> {
        return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
            code: code as SupportedLanguage,
            name,
        }));
    }

    /**
     * Generate language selection keyboard
     */
    generateLanguageKeyboard() {
        const languages = this.getAvailableLanguages();
        return languages.map((lang) => [{ text: lang.name, callback_data: `lang_${lang.code}` }]);
    }

    /**
     * Check if a language is supported
     */
    isSupportedLanguage(lang: string): lang is SupportedLanguage {
        return Object.keys(LANGUAGE_NAMES).includes(lang);
    }
}

export const localizationService = new LocalizationService();
