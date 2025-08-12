export interface UserSession {
  step: 'start' | 'course_detail' | 'entering_email' | 'entering_name' | 'entering_position' | 'completed';
  selectedCourseId?: number;
  email?: string;
  name?: string;
  workPosition?: string;
}

export interface BotContext {
  session: UserSession;
}
