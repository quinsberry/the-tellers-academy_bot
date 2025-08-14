import fs from 'fs';
import path from 'path';

export interface Author {
    name: string;
    image: string;
}

export interface Course {
    id: number;
    name: string;
    short_description: string;
    description: string;
    authors: Author[];
    price: number;
    currency: string;
    start_date: string;
    end_date: string;
    image: string;
    payment_link: string;
}

export interface CoursesData {
    courses: Course[];
}

export class CoursesService {
    private coursesData: CoursesData | null = null;

    async init(): Promise<void> {
        console.log('🔍 Initializing Courses...');
        this.coursesData = this.loadCourses();
        console.log('✅ Courses initialized');
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
            const coursesPath = path.join(__dirname, '..', 'data.json');
            const coursesFile = fs.readFileSync(coursesPath, 'utf-8');
            return JSON.parse(coursesFile);
        } catch (error) {
            console.error('❌ Failed to load courses:', error);
            throw error;
        }
    }
}

export const coursesService = new CoursesService();
