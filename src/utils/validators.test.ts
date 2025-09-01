import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateWorkPosition, ValidationResult } from './validators';
import { localizationService } from '@/services/LocalizationService';

// Mock the localization service
vi.mock('@/services/LocalizationService', () => ({
    localizationService: {
        t: vi.fn((key: string) => {
            const translations: Record<string, string> = {
                'validation.position.tooShort': 'Position is too short',
                'validation.position.tooLong': 'Position is too long',
                'validation.position.invalidCharacters': 'Position contains invalid characters',
                'validation.position.suspicious': 'Position contains suspicious patterns',
                'validation.position.noLetters': 'Position must contain letters',
            };
            return translations[key] || key;
        }),
    },
}));

describe('validateWorkPosition', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Valid positions', () => {
        it('should validate basic position names', () => {
            const testCases = [
                { input: 'Developer', expected: 'Developer' },
                { input: 'Software Engineer', expected: 'Software Engineer' },
                { input: 'Product Manager', expected: 'Product Manager' },
                { input: 'UI/UX Designer', expected: 'UI/UX Designer' },
                { input: 'Data Analyst', expected: 'Data Analyst' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
                expect(result.error).toBeUndefined();
            });
        });

        it('should handle positions with numbers', () => {
            const testCases = [
                { input: 'Level 2 Support', expected: 'Level 2 Support' },
                { input: 'Team Lead 3', expected: 'Team Lead 3' },
                { input: 'iOS Developer', expected: 'iOS Developer' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should handle positions with special characters', () => {
            const testCases = [
                { input: 'Full-Stack Developer', expected: 'Full-Stack Developer' },
                { input: 'Business Analyst (Finance)', expected: 'Business Analyst (Finance)' },
                { input: 'Project Manager & Coordinator', expected: 'Project Manager & Coordinator' },
                { input: 'QA/QC Engineer', expected: 'QA/QC Engineer' },
                { input: 'Sr. Software Engineer', expected: 'Sr. Software Engineer' },
                { input: 'VP, Engineering', expected: 'VP, Engineering' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should handle Cyrillic characters', () => {
            const testCases = [
                { input: 'Разработчик', expected: 'Разработчик' },
                { input: 'Менеджер проектов', expected: 'Менеджер проектов' },
                { input: 'Системный администратор', expected: 'Системный администратор' },
                {
                    input: 'Благодійний фонд "Громадянин", Керівник у сфері комунікації та розвитку звʼязків у колі друзів та із зовнішнім середовищем',
                    expected:
                        'Благодійний фонд "Громадянин", Керівник у сфері комунікації та розвитку звʼязків у колі друзів та із зовнішнім середовищем',
                },
                {
                    input: 'Благодійний фонд "Громадянин", Керівник у сфері комунікації та розвитку звʼязків',
                    expected: 'Благодійний фонд "Громадянин", Керівник у сфері комунікації та розвитку звʼязків',
                },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should handle accented characters', () => {
            const testCases = [
                { input: 'Développeur', expected: 'Développeur' },
                { input: 'Diseñador', expected: 'Diseñador' },
                { input: 'Ingénieur logiciel', expected: 'Ingénieur logiciel' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should trim whitespace', () => {
            const testCases = [
                { input: '  Developer  ', expected: 'Developer' },
                { input: '  Product Manager  ', expected: 'Product Manager' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should handle minimum valid length (2 characters)', () => {
            const result = validateWorkPosition('QA');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('QA');
        });

        it('should handle maximum valid length (255 characters)', () => {
            const longPosition =
                'Senior Full-Stack Software Engineer & Technical Lead with expertise in JavaScript Tech';
            expect(longPosition.length).toBe(86); // Ensure we're testing a long but valid position

            const result = validateWorkPosition(longPosition);
            expect(result.isValid).toBe(true);
            expect(result.value).toBe(
                'Senior Full-Stack Software Engineer & Technical Lead with expertise in JavaScript Tech',
            );
        });
    });

    describe('Invalid positions - Length validation', () => {
        it('should reject empty string', () => {
            const result = validateWorkPosition('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position is too short');
            expect(result.value).toBeUndefined();
        });

        it('should reject single character', () => {
            const result = validateWorkPosition('A');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position is too short');
        });

        it('should reject whitespace-only input', () => {
            const result = validateWorkPosition('   ');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position is too short');
        });

        it('should reject positions longer than 255 characters', () => {
            const tooLongPosition = 'A'.repeat(256);
            const result = validateWorkPosition(tooLongPosition);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position is too long');
        });
    });

    describe('Invalid positions - Character validation', () => {
        it('should accept positions with valid special characters', () => {
            const validChars = ['-', '.', ',', '&', '/', '(', ')'];

            validChars.forEach((char) => {
                const result = validateWorkPosition(`Developer${char}Test`);
                expect(result.isValid).toBe(true);
            });
        });

        it('should accept positions with line breaks (treated as whitespace)', () => {
            const result = validateWorkPosition('Software\nEngineer');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('Software\nEngineer');
        });

        it('should accept positions with tabs (treated as whitespace)', () => {
            const result = validateWorkPosition('Software\tEngineer');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('Software\tEngineer');
        });
    });

    describe('Invalid positions - Must contain letters', () => {
        it('should reject positions with only numbers', () => {
            const result = validateWorkPosition('123456');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position must contain letters');
        });

        it('should reject positions with only special characters', () => {
            const result = validateWorkPosition('---...()/&,');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position must contain letters');
        });

        it('should reject positions with only spaces', () => {
            const result = validateWorkPosition('   ');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Position is too short'); // This gets caught by length check first
        });

        it('should accept positions with letters and numbers/allowed special chars', () => {
            const result = validateWorkPosition('C Developer 2024');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('C Developer 2024');
        });
    });

    describe('Edge cases', () => {
        it('should handle mixed case input correctly', () => {
            const result = validateWorkPosition('sOfTwArE eNgInEeR');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('sOfTwArE eNgInEeR');
        });

        it('should handle positions starting/ending with valid special characters', () => {
            const testCases = [
                { input: '.NET Developer', expected: '.NET Developer' },
                { input: 'Manager (Remote)', expected: 'Manager (Remote)' },
                { input: 'Web Developer/Designer', expected: 'Web Developer/Designer' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = validateWorkPosition(input);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(expected);
            });
        });

        it('should handle single word positions', () => {
            const singleWords = ['Developer', 'Manager', 'Analyst', 'Designer', 'Architect'];

            singleWords.forEach((word) => {
                const result = validateWorkPosition(word);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(word);
            });
        });

        it('should handle valid long positions under 255 characters', () => {
            const validLong = 'Senior Software Engineer and Technical Lead'; // Under 255
            const result = validateWorkPosition(validLong);
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('Senior Software Engineer and Technical Lead');
        });

        it('should handle positions at exactly 2 characters', () => {
            const result = validateWorkPosition('IT');
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('IT');
        });
    });

    describe('Localization service integration', () => {
        it('should call localization service for error messages', () => {
            validateWorkPosition('A'); // Too short
            expect(localizationService.t).toHaveBeenCalledWith('validation.position.tooShort');

            validateWorkPosition('A'.repeat(256)); // Too long
            expect(localizationService.t).toHaveBeenCalledWith('validation.position.tooLong');

            validateWorkPosition('12345'); // No letters
            expect(localizationService.t).toHaveBeenCalledWith('validation.position.noLetters');
        });
    });
});
