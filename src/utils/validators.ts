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
      return { isValid: false, error: '❌ Email address is too long. Please enter a valid email address:' };
    }

    if (trimmedEmail.length < 5) {
      return { isValid: false, error: '❌ Email address is too short. Please enter a valid email address:' };
    }

    // Comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: '❌ Please enter a valid email address (e.g., user@example.com):' };
    }

    // Check for common domain typos
    const domain = trimmedEmail.split('@')[1]?.toLowerCase();
    const typoSuggestion = checkEmailDomainTypos(trimmedEmail, domain);
    if (typoSuggestion) {
      return { isValid: false, error: typoSuggestion };
    }

    return { 
      isValid: true, 
      value: trimmedEmail.toLowerCase() 
    };
}

/**
 * Validates user's full name
 */
export function validateName(name: string): ValidationResult {
    const trimmedName = name.trim();
    
    // Check minimum length
    if (trimmedName.length < 2) {
      return { isValid: false, error: '❌ Please enter a valid name (at least 2 characters):' };
    }

    // Check maximum length
    if (trimmedName.length > 100) {
      return { isValid: false, error: '❌ Name is too long. Please enter a name with less than 100 characters:' };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/;
    if (!nameRegex.test(trimmedName)) {
      return { isValid: false, error: '❌ Please enter a valid name using only letters, spaces, hyphens, and apostrophes:' };
    }

    // Check for minimum number of parts
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length < 1) {
      return { isValid: false, error: '❌ Please enter at least your first name:' };
    }

    // Check that each part has reasonable length
    const hasValidParts = nameParts.every(part => part.length >= 1 && part.length <= 50);
    if (!hasValidParts) {
      return { isValid: false, error: '❌ Please enter a valid name (each part should be 1-50 characters):' };
    }

    // Check for suspicious patterns
    if (/(.)\1{4,}/.test(trimmedName)) {
      return { isValid: false, error: '❌ Please enter a real name:' };
    }

    // Capitalize properly
    const capitalizedName = nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

    return { 
      isValid: true, 
      value: capitalizedName 
    };
}

/**
 * Validates work position
 */
export function validateWorkPosition(position: string): ValidationResult {
    const trimmedPosition = position.trim();
    
    // Check minimum length
    if (trimmedPosition.length < 2) {
      return { isValid: false, error: '❌ Please enter a valid work position (at least 2 characters):' };
    }

    // Check maximum length
    if (trimmedPosition.length > 100) {
      return { isValid: false, error: '❌ Work position is too long. Please enter a position with less than 100 characters:' };
    }

    // Check for valid characters
    const positionRegex = /^[a-zA-ZÀ-ÿĀ-žА-я0-9\s\-\.\,\&\/\(\)]+$/;
    if (!positionRegex.test(trimmedPosition)) {
      return { isValid: false, error: '❌ Please enter a valid work position using letters, numbers, and common punctuation:' };
    }

    // Check for suspicious patterns
    if (/(.)\1{4,}/.test(trimmedPosition)) {
      return { isValid: false, error: '❌ Please enter a real work position:' };
    }

    // Check that it contains letters
    if (!/[a-zA-ZÀ-ÿĀ-žА-я]/.test(trimmedPosition)) {
      return { isValid: false, error: '❌ Please enter a valid work position that contains letters:' };
    }

    // Capitalize first letter of each word
    const capitalizedPosition = trimmedPosition
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return { 
      isValid: true, 
      value: capitalizedPosition 
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
      'outlook.com': ['outlook.co', 'outlok.com']
    };

    for (const [correctDomain, typos] of Object.entries(commonDomainTypos)) {
      if (typos.includes(domain)) {
        return `❌ Did you mean *${email.replace(domain, correctDomain)}*? Please enter the correct email address:`;
      }
    }

    return null;
}
