import { Promotion } from '@/services/CoursesService';

export function isValidPromotion(promotion: Promotion): boolean {
    return promotion && new Date(promotion.end_date) > new Date();
}
