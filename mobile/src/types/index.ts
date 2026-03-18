// ── User & Auth ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'consumer';
  phone: string | null;
  address: string | null;
  firebase_uid: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  farm_name: string;
  farm_location: string | null;
  description: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface SignUpData {
  email: string;
  name: string;
  role: 'farmer' | 'consumer';
  phone?: string;
  address?: string;
  firebase_uid: string;
}

export interface LoginResponse {
  access: string;
  user: User;
}

export interface SocialLoginData {
  provider: string;
  token: string;
}

export interface UserUpdateData {
  name?: string;
  phone?: string;
  address?: string;
}

// ── Category & Product ───────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon_url: string | null;
}

export interface Product {
  id: string;
  farmer_id: string;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  ai_suggested_price: number | null;
  photos: string[];
  stock: number;
  region: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: Category | null;
}

export interface ProductCreate {
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  photos?: string[];
  stock?: number;
  region?: string;
}

export interface ProductUpdate {
  category_id?: number;
  name?: string;
  description?: string;
  price?: number;
  photos?: string[];
  stock?: number;
  region?: string;
  is_active?: boolean;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProductFilterParams {
  page?: number;
  page_size?: number;
  category_id?: number;
  region?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
}

// ── Cart ─────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
}

// ── Order ────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItemCreate {
  product_id: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_price: number;
  shipping_address: string;
  shipping_name: string;
  shipping_phone: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderCreateData {
  items: OrderItemCreate[];
  shipping_address: string;
  shipping_name: string;
  shipping_phone: string;
}

// ── Payment ──────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentPrepareRequest {
  order_id: string;
  method: string;
}

export interface PaymentPrepareResponse {
  merchant_uid: string;
  amount: number;
  order_id: string;
  pg_provider: string;
  pg_merchant_id: string;
}

export interface PaymentConfirmRequest {
  imp_uid: string;
  merchant_uid: string;
  order_id: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  pg_transaction_id: string | null;
  created_at: string;
}

// ── Review ───────────────────────────────────────────────────

export interface ReviewCreate {
  product_id: string;
  order_id?: string;
  rating: number;
  text?: string;
  photos?: string[];
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  text: string | null;
  photos: string[];
  created_at: string;
}

// ── Notification ─────────────────────────────────────────────

export type NotificationType = 'order_status' | 'price_alert' | 'promotion';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── AI ───────────────────────────────────────────────────────

export type DemandTrend = 'increasing' | 'stable' | 'decreasing';

export interface PriceSuggestion {
  id: string;
  product_id: string;
  suggested_price: number;
  confidence: number;
  demand_level: string;
  reasoning: string | null;
  created_at: string;
}

export interface DemandForecast {
  id: string;
  category_id: number;
  period_start: string;
  period_end: string;
  predicted_demand: number;
  trend: DemandTrend;
  confidence: number;
  created_at: string;
}

export interface PriceTrendPoint {
  date: string;
  price: number;
  volume: number | null;
}

export interface PriceTrendResponse {
  product_id: string;
  product_name: string;
  current_price: number;
  trend: DemandTrend;
  data_points: PriceTrendPoint[];
  forecast_next_week: number | null;
}
