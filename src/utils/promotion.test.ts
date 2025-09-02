// Tue Sep 02 2025 20:22:17 GMT+0200 (Central European Summer Time)

import { describe } from 'node:test';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { isValidPromotion } from './promotion';

describe('isValidPromotion', () => {
    const promotion = {
        end_date: '2025-09-03',
        name: 'Test Promotion',
        description: 'Test Description',
        price: 100,
        payment: {
            privatbank: {
                link: 'https://www.google.com',
                qr_code: 'https://www.google.com',
            },
            monobank: {
                requisites: {
                    iban: 'UA803220010000026001320034404',
                    tax_id: '3534101801',
                    recipient: 'Test Recipient',
                    description: 'Test Description',
                },
            },
        },
    };

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return true if the promotion is valid', () => {
        vi.setSystemTime(new Date('Tue Sep 02 2025 20:22:17 GMT+0200 (Central European Summer Time)'));
        expect(
            isValidPromotion({
                ...promotion,
                end_date: '2025-09-03',
            }),
        ).toBe(true);
    });

    
    it('should return false if the promotion is valid', () => {
        vi.setSystemTime(new Date('Tue Sep 02 2025 02:00:00 GMT+0200 (Central European Summer Time)'));
        expect(
            isValidPromotion({
                ...promotion,
                end_date: '2025-09-02',
            }),
        ).toBe(false);
    });
});
