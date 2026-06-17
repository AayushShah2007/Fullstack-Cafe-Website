// ========== ENUMS ==========
export type UserRole = "admin" | "user"
export type OrderType = "takeaway" | "dine-in" | "delivery"
export type OrderStatus =
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "making"
  | "packing"
  | "dispatched"
  | "collect"
  | "platting"
  | "serving"
  | "delivered"
  | "completed"
  | "cancelled"
export type PaymentMethod = "upi" | "card" | "cash"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

// ========== USERS ==========
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address_line1?: string
  address_line2?: string
  landmark?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
  role: UserRole
  created_at: string
}

// ========== CATEGORIES ==========
export interface Category {
  id: string
  name: string
  description: string
  image_url?: string
  sort_order: number
}

// ========== MENU ITEMS ==========
export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string
  price: number
  image_url?: string
  is_available: boolean
  is_vegetarian: boolean
  ingredients?: string
  calories?: number
  prep_time?: number
  spice_level?: "mild" | "medium" | "spicy"
  is_bestseller?: boolean
  created_at: string
  category?: Category
}

// ========== CART ==========
export interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  notes?: string
}

// ========== ORDERS ==========
export interface OrderItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  user_id: string
  items: OrderItem[]
  total_amount: number
  discount_amount: number
  order_type: OrderType
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  razorpay_order_id?: string
  razorpay_payment_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_address?: string
  address_line1?: string
  address_line2?: string
  district?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
  coupon_code?: string
  timeline_stage: number
  payment_screenshot?: string
  created_at: string
  updated_at: string
  user?: User
}

// ========== PAYMENTS ==========
export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  razorpay_order_id: string
  razorpay_payment_id?: string
  status: PaymentStatus
  created_at: string
}

// ========== RESERVATIONS ==========
export interface Reservation {
  id: string
  user_id?: string
  name: string
  phone: string
  email?: string
  date: string
  time: string
  guests: number
  notes?: string
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled"
  created_at: string
}

// ========== COUPONS ==========
export interface Coupon {
  id: string
  code: string
  discount_percent: number
  max_discount: number
  min_order: number
  usage_limit: number
  used_count: number
  per_user_limit: number
  is_active: boolean
  expires_at: string
  created_at: string
}

// ========== REVIEWS ==========
export interface Review {
  id: string
  user_id?: string
  user_name: string
  rating: number
  comment: string
  menu_item_id?: string
  is_approved: boolean
  created_at: string
}

// ========== ADMIN STATS ==========
export interface AdminStats {
  total_orders_today: number
  revenue_today: number
  pending_orders: number
  active_users: number
  orders_by_day: { date: string; count: number; revenue: number }[]
  top_items: { name: string; quantity: number; revenue: number }[]
}
