import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uidfzbsrbrridgkskokx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGZ6YnNyYnJyaWRna3Nrb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzAyMzYsImV4cCI6MjA4NjU0NjIzNn0.VXU8-GIZVkeiNRlGAjulH_2ThaJKdgUhY2zfwA5puhE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types sesuai schema database
export type OrderStatus = 'BARU' | 'DIPROSES' | 'SIAP' | 'SELESAI' | 'DIBATALKAN';

export interface Category {
  id: number;
  name: string;
  item_count: number;
  created_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  stock: number;
  is_available: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'BELUM_BAYAR' | 'SUDAH_BAYAR';
export type PaymentMethod = 'CASH' | 'QRIS';

export interface Order {
  id: number;
  order_number: string;
  queue_number: number;
  customer_name: string;
  table_number: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  payment_method: PaymentMethod | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  subtotal: number;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  queue_number: number;
  customer_name: string;
  table_number: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  payment_method: PaymentMethod | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  item_count?: number;
  total_quantity?: number;
}
