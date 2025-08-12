import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number; // in cents
  currency: string;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  course_id: string;
  user_id: string; // Telegram user ID
  user_name: string | null;
  user_contact: string | null;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  amount: number; // in cents
  currency: string;
  created_at: string;
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export class Database {
  static async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return data || [];
  }

  static async getCourse(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data;
  }

  static async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  }

  static async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }

    return data;
  }

  static async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  }
}
