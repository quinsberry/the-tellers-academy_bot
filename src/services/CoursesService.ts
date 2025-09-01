import fs from 'fs';
import path from 'path';
import { handleSystemError } from '../utils/errorHandler';
import { getSrcDir } from '@/utils/paths';
import { logger } from '@/utils/logger';

export interface Author {
    name: string;
    image: string;
}

export interface Lecture {
    number: number;
    name: string;
    speaker: string;
    dateAndTime: string;
    description: string;
}

export interface Course {
    id: number;
    name: string;
    short_name: string;
    details: {
        title: string;
        description: string;
        lectures: Lecture[];
    };
    price: number;
    currency_symbol: string;
    start_date: string;
    end_date: string;
    payment: {
        privatbank: {
            link: string;
            qr_code: string;
        };
        monobank: {
            requisites: {
                iban: string;
                tax_id: string;
                recipient: string;
                description: string;
            };
        };
    };
}

export interface CoursesData {
    courses: Course[];
}

export class CoursesService {
    private coursesData: CoursesData | null = null;

    async init(): Promise<void> {
        try {
            this.coursesData = this.loadCourses();
            logger.info('✅ Courses initialized');
        } catch (error) {
            handleSystemError(error as Error, {
                operation: 'courses_initialization',
            });
            throw error;
        }
    }

    getAllCourses(): Course[] {
        if (!this.coursesData) {
            throw new Error('Courses are not initialized');
        }
        return this.coursesData.courses;
    }

    getCourseById(id: number): Course | null {
        const courses = this.getAllCourses();
        return courses.find((course) => course.id === id) || null;
    }

    private loadCourses(): CoursesData {
        try {
            const coursesPath = path.join(getSrcDir(), 'data.json');
            const coursesFile = fs.readFileSync(coursesPath, 'utf-8');
            return JSON.parse(coursesFile);
        } catch (error) {
            handleSystemError(error as Error, {
                operation: 'load_courses_file',
                coursesPath: path.join(getSrcDir(), 'data.json'),
            });
            throw error;
        }
    }
}

export const coursesService = new CoursesService();
