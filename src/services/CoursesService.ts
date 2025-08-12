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
  private static coursesData: CoursesData | null = null;

  static loadCourses(): CoursesData {
    const coursesPath = path.join(__dirname, '..', 'data.json');
    const coursesFile = fs.readFileSync(coursesPath, 'utf-8');
    this.coursesData = JSON.parse(coursesFile);
    return this.coursesData!;
  }

  static getAllCourses(): Course[] {
    if (!this.coursesData) {
      this.loadCourses();
    }
    return this.coursesData?.courses || [];
  }

  static getCourseById(id: number): Course | null {
    const courses = this.getAllCourses();
    return courses.find(course => course.id === id) || null;
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static formatAuthors(authors: Author[]): string {
    return authors.map(author => author.name).join(', ');
  }
}
