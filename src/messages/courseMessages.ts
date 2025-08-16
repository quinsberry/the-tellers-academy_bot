import { Lecture, type Course } from '@/services/CoursesService';
import { formatCourseDate } from '@/utils/formatDates';
import { localizationService } from '@/services/LocalizationService';
import { b, fmt, FormattedString } from '@grammyjs/parse-mode';

export const BUY_COURSE_KEY = 'buy_course';
export const BACK_TO_COURSES_KEY = 'back_to_courses';
export const RETRY_SAVE_DATA_KEY = 'retry_save_data';

/**
 * Generate welcome message with course list
 */
export function generateWelcomeMessage(courses: Course[]): FormattedString {
    const generateCourse = (course: Course, idx: number) => {
        const courseTime = `${formatCourseDate(course.start_date)} — ${formatCourseDate(course.end_date)}`;
        return FormattedString.join([
            fmt`${idx + 1}. ${course.name}\n\n`,
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
    return [[{ text: '← Back to course', callback_data: `course_${courseId}` }]];
}

/**
 * Generate success message after data is saved
 */
export function generateSuccessMessage(paymentLink: string): string {
    return (
        '✅ Your information has been saved successfully!\n\n' +
        '💳 Follow the link to pay and save the receipt. You will need to confirm your purchase:\n\n' +
        `${paymentLink}\n\n` +
        'Thank you for choosing Tellers Agency Academy!'
    );
}

/**
 * Generate back to courses keyboard for final message
 */
export function generateFinalKeyboard() {
    return [[{ text: '🏠 Back to courses', callback_data: 'back_to_courses' }]];
}
