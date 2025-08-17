import { Lecture, type Course } from '@/services/CoursesService';
import { formatCourseDate } from '@/utils/formatDates';
import { localizationService } from '@/services/LocalizationService';
import { a, b, code, fmt, FormattedString } from '@grammyjs/parse-mode';
import { config } from '@/config';

export const BUY_COURSE_KEY = 'buy_course';
export const BACK_TO_COURSES_KEY = 'back_to_courses';
export const BACK_TO_BANKS_KEY = 'back_to_banks';
export const RETRY_SAVE_DATA_KEY = 'retry_save_data';
export const SELECT_PRIVATBANK_KEY = 'select_privatbank';
export const SELECT_MONOBANK_KEY = 'select_monobank';

/**
 * Generate welcome message with course list
 */
export function generateWelcomeMessage(courses: Course[]): FormattedString {
    const generateCourse = (course: Course, idx: number) => {
        const courseTime = `${formatCourseDate(course.start_date)} — ${formatCourseDate(course.end_date)}`;
        return FormattedString.join([
            fmt`${b}${idx + 1}. ${course.name}${b}\n\n`,
            `${localizationService.t('welcome.courseTime')}: ${courseTime}\n`,
            `${localizationService.t('labels.price')}: ${course.price}${course.currency_symbol}\n\n`,
        ]);
    };

    return FormattedString.join([
        fmt`${b}${localizationService.t('welcome.title')}${b}\n`,
        fmt`${localizationService.t('welcome.subtitle')}\n\n`,
        fmt`${b}${localizationService.t('welcome.availableCourses', { count: courses.length })}${b}\n\n`,
        ...courses.map(generateCourse),
    ]);
}

/**
 * Generate course detail message
 */
export function generateCourseDetails(course: Course): FormattedString {
    const generateLecture = (lecture: Lecture) => {
        return FormattedString.join([
            fmt`${b}${localizationService.t('course.details.lecture')} ${lecture.number}: ${lecture.name}${b}\n`,
            fmt`${b}${localizationService.t('course.details.speaker')}${b}: ${lecture.speaker}\n`,
            fmt`${b}${localizationService.t('course.details.dateAndTime')}${b}: ${lecture.dateAndTime}\n\n`,
            fmt`${lecture.description}\n\n\n`,
        ]);
    };

    return FormattedString.join([
        fmt`${b}${course.details.title}${b}\n\n`,
        fmt`${course.details.description}\n\n`,
        fmt`${b}${localizationService.t('labels.price')}: ${course.price}${course.currency_symbol}${b}\n\n`,
        fmt`${b}${localizationService.t('course.details.courseProgram')}${b}\n\n`,
        ...course.details.lectures.map(generateLecture),
    ]);
}

/**
 * Generate course selection keyboard
 */
export function generateCourseKeyboard(courses: Course[]) {
    return courses.map((course) => [{ text: course.short_name, callback_data: `course_${course.id}` }]);
}

/**
 * Generate course detail keyboard
 */
export function generateCourseDetailKeyboard(courseId: number) {
    return [
        [{ text: localizationService.t('buttons.buyCourse'), callback_data: BUY_COURSE_KEY }],
        [{ text: localizationService.t('buttons.backToCourses'), callback_data: BACK_TO_COURSES_KEY }],
    ];
}

/**
 * Generate back to course keyboard
 */
export function generateBackToCourseKeyboard(courseId: number) {
    return [[{ text: localizationService.t('buttons.backToCourse'), callback_data: `course_${courseId}` }]];
}

/**
 * Generate bank selection message
 */
export function generateBankSelectionMessage(): FormattedString {
    return FormattedString.join([
        fmt`${b}${localizationService.t('payment.bankSelection.title')}${b}\n\n`,
        fmt`${localizationService.t('payment.bankSelection.description')}\n\n`,
    ]);
}

/**
 * Generate bank selection keyboard
 */
export function generateBankSelectionKeyboard(courseId: number) {
    return [
        [
            { text: localizationService.t('payment.privatbank'), callback_data: SELECT_PRIVATBANK_KEY },
            { text: localizationService.t('payment.monobank'), callback_data: SELECT_MONOBANK_KEY },
        ],
        [{ text: localizationService.t('buttons.backToCourse'), callback_data: `course_${courseId}` }],
    ];
}

/**
 * Generate bank-specific payment message
 */
export function generateBankPaymentMessage(bank: 'privatbank' | 'monobank', course: Course): FormattedString {

    let paymentDetails: FormattedString
    
    if (bank === 'privatbank') {
        paymentDetails = FormattedString.join([
            fmt`${localizationService.t('payment.scanQROR')} ${a(course.payment.privatbank.link)}${localizationService.t('payment.followTheLink')}${a}\n\n`,
        ]);
    } else if (bank === 'monobank') {
        paymentDetails = FormattedString.join([
            fmt`${b}${localizationService.t('payment.requisites.requisitesTitle')}:${b}\n`,
            fmt`(${localizationService.t('payment.requisites.copyInstructions')})\n\n`,
            fmt`${b}${localizationService.t('payment.requisites.iban')}${b}\n`,
            fmt`${code}${course.payment.monobank.requisites.iban}${code}\n\n`,
            fmt`${b}${localizationService.t('payment.requisites.tax_id')}${b}\n`,
            fmt`${code}${course.payment.monobank.requisites.tax_id}${code}\n\n`,
            fmt`${b}${localizationService.t('payment.requisites.recipient')}${b}\n`,
            fmt`${code}${course.payment.monobank.requisites.recipient}${code}\n\n`,
            fmt`${b}${localizationService.t('payment.requisites.description')}${b}\n`,
            fmt`${code}${course.payment.monobank.requisites.description}${code}\n\n`,
        ]);
    } else {
        throw new Error('Invalid bank');
    }

    return FormattedString.join([
        fmt`${b}${localizationService.t(`payment.bankDetails.${bank}.title`)}${b}\n\n`,
        fmt`${b}${course.name}${b}\n`,
        fmt`${b}${localizationService.t('labels.price')}:${b} ${course.price}${course.currency_symbol}\n\n`,
        paymentDetails,
        fmt`${localizationService.t('payment.paymentDetails')}\n\n`,
        fmt`${localizationService.t('payment.thankYou')}\n\n`,
    ]);
}

/**
 * Generate success message after data is saved (deprecated - kept for backward compatibility)
 */
export function generateSuccessMessage(paymentLinks: {
    privatbankLink: string;
    monobankLink: string;
}): FormattedString {
    return FormattedString.join([
        fmt`${b}${localizationService.t('payment.title')}${b}\n\n`,
        fmt`${localizationService.t('payment.choosePaymentMethod')}\n\n`,
        fmt`${a(paymentLinks.privatbankLink)}${localizationService.t('payment.privatbank')}${a}    ${a(
            paymentLinks.monobankLink,
        )}${localizationService.t('payment.monobank')}${a}\n\n`,
        fmt`${localizationService.t('payment.paymentDetails')}\n\n`,
        fmt`${localizationService.t('payment.thankYou')}\n\n`,
    ]);
}

/**
 * Generate back to courses keyboard for final message
 */
export function generateFinalKeyboard() {
    return [
        [{ text: localizationService.t('buttons.backToBanks'), callback_data: BACK_TO_BANKS_KEY }],
        [{ text: localizationService.t('buttons.backToHome'), callback_data: BACK_TO_COURSES_KEY }],
        ...(config.telegram.supportUrl
            ? [[{ text: localizationService.t('buttons.contactSupport'), url: config.telegram.supportUrl }]]
            : []),
    ];
}
