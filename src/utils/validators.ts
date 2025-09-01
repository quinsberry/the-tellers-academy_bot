import { localizationService } from '@/services/LocalizationService';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    value?: string;
}

/**
 * Validates email address with comprehensive checks
 */
export function validateEmail(email: string): ValidationResult {
    const trimmedEmail = email.trim();

    // Check length limits
    if (trimmedEmail.length > 254) {
        return { isValid: false, error: localizationService.t('validation.email.tooLong') };
    }

    if (trimmedEmail.length < 5) {
        return { isValid: false, error: localizationService.t('validation.email.tooShort') };
    }

    // Comprehensive email validation regex
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: localizationService.t('validation.email.invalid') };
    }

    // Check for common domain typos
    const domain = trimmedEmail.split('@')[1]?.toLowerCase();
    const typoSuggestion = checkEmailDomainTypos(trimmedEmail, domain ?? '');
    if (typoSuggestion) {
        return { isValid: false, error: typoSuggestion };
    }

    return {
        isValid: true,
        value: trimmedEmail.toLowerCase(),
    };
}

/**
 * Validates user's full name
 */
export function validateName(name: string): ValidationResult {
    const trimmedName = name.trim();

    // Check minimum length
    if (trimmedName.length < 2) {
        return { isValid: false, error: localizationService.t('validation.name.tooShort') };
    }

    // Check maximum length
    if (trimmedName.length > 100) {
        return { isValid: false, error: localizationService.t('validation.name.tooLong') };
    }

    // Check for valid characters (letters including Cyrillic, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿĀ-ž\u0400-\u04FF\s\-'\.]+$/;
    if (!nameRegex.test(trimmedName)) {
        return { isValid: false, error: localizationService.t('validation.name.invalidCharacters') };
    }

    // Check for minimum number of parts
    const nameParts = trimmedName.split(/\s+/).filter((part) => part.length > 0);
    if (nameParts.length < 1) {
        return { isValid: false, error: localizationService.t('validation.name.missingFirstName') };
    }

    // Check that each part has reasonable length
    const hasValidParts = nameParts.every((part) => part.length >= 1 && part.length <= 50);
    if (!hasValidParts) {
        return { isValid: false, error: localizationService.t('validation.name.invalidPartLength') };
    }

    // Capitalize properly
    const capitalizedName = nameParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

    return {
        isValid: true,
        value: capitalizedName,
    };
}

/**
 * Validates work position
 */
export function validateWorkPosition(position: string): ValidationResult {
    const trimmedPosition = position.trim();

    // Check minimum length
    if (trimmedPosition.length < 2) {
        return { isValid: false, error: localizationService.t('validation.position.tooShort') };
    }

    // Check maximum length
    if (trimmedPosition.length > 255) {
        return { isValid: false, error: localizationService.t('validation.position.tooLong') };
    }

    // Check that it contains letters
    if (!/[a-zA-ZÀ-ÿĀ-žА-я]/.test(trimmedPosition)) {
        return { isValid: false, error: localizationService.t('validation.position.noLetters') };
    }

    // Capitalize first letter of each word
    const capitalizedPosition = trimmedPosition
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        isValid: true,
        value: trimmedPosition,
    };
}

/**
 * Check for common email domain typos and suggest corrections
 */
function checkEmailDomainTypos(email: string, domain: string): string | null {
    const commonDomainTypos = {
        'gmail.com': ['gmai.com', 'gmial.com', 'gmail.co', 'gmaill.com'],
        'yahoo.com': ['yaho.com', 'yahoo.co', 'yahooo.com'],
        'hotmail.com': ['hotmai.com', 'hotmail.co', 'hotmial.com'],
        'outlook.com': ['outlook.co', 'outlok.com'],
    };

    for (const [correctDomain, typos] of Object.entries(commonDomainTypos)) {
        if (typos.includes(domain)) {
            return localizationService.t('validation.email.typoSuggestion', {
                suggestion: email.replace(domain, correctDomain),
            });
        }
    }

    return null;
}
