import { type Course } from '@/services/CoursesService';
import { formatCourseDate } from '@/utils/format';

export const BUY_COURSE_KEY = 'buy_course';
export const BACK_TO_COURSES_KEY = 'back_to_courses';
export const RETRY_SAVE_DATA_KEY = 'retry_save_data';

/**
 * Generate welcome message with course list
 */
export function generateWelcomeMessage(courses: Course[]): string {
    let message = '🎓 *Welcome to the Tellers Agency Academy*\n\n';
    message += '📚 *Available Courses:*\n\n';

    courses.forEach((course) => {
        message += `*${course.name}*\n`;
        message += `${course.short_description}\n\n`;
        message += `   📅 Starts: *${formatCourseDate(course.start_date)}*\n`;
        message += `   💰 ${course.price} ${course.currency}\n\n`;
    });

    message += '👇 *Select a course to view details:*';
    return message;
}

/**
 * Generate course detail message
 */
export function generateCourseDetails(course: Course): string {
    const formatedAuthors = course.authors.map((author) => author.name).join(', ');
    return (
        `📖 ${course.name}\n\n` +
        `📝 ${course.description}\n\n` +
        `👥 Authors: ${formatedAuthors}\n\n` +
        `📅 Start Date: ${formatCourseDate(course.start_date)}\n` +
        `📅 End Date: ${formatCourseDate(course.end_date)}\n\n` +
        `💰 Price: ${course.price} ${course.currency}`
    );
}

/**
 * Generate course selection keyboard
 */
export function generateCourseKeyboard(courses: Course[]) {
    return courses.map((course) => [{ text: course.name, callback_data: `course_${course.id}` }]);
}

/**
 * Generate course detail keyboard
 */
export function generateCourseDetailKeyboard(courseId: number) {
    return [
        [{ text: '💳 Buy the course', callback_data: BUY_COURSE_KEY }],
        [{ text: '← Back to courses', callback_data: BACK_TO_COURSES_KEY }],
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
