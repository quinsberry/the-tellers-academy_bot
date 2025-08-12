export interface UserSession {
  step: 'start' | 'selecting_course' | 'entering_contact' | 'payment';
  selectedCourseId?: string;
  contact?: string;
  orderId?: string;
}

export interface BotContext {
  session: UserSession;
}
