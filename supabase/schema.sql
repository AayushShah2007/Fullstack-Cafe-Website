-- ============================================
-- Eat O'Clock - Complete Database Schema
-- Run this in Supabase SQL Editor after
-- creating your project at supabase.com
-- ============================================

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT DEFAULT 'Mumbai',
  district TEXT DEFAULT 'Borivali West',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  order_type TEXT NOT NULL CHECK (order_type IN ('takeaway', 'dine-in', 'delivery')),
  status TEXT NOT NULL DEFAULT 'awaiting_approval'
    CHECK (status IN ('awaiting_approval','approved','rejected','making','packing','dispatched','collect','platting','serving','delivered','completed','cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  notes TEXT,
  coupon_code TEXT,
  timeline_stage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  guests INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent DECIMAL(5,2) NOT NULL,
  max_discount DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OTP Codes (temporary, via Resend)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT DEFAULT 'Mumbai',
  district TEXT DEFAULT 'Borivali West',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_email ON otp_codes(email);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_coupons_code ON coupons(code);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admins can read/write all
CREATE POLICY "admin_all" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Everyone can read categories & menu
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "public_read_menu" ON menu_items FOR SELECT USING (TRUE);

-- Orders: user sees own, admin sees all
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed data: Categories
INSERT INTO categories (name, description, sort_order) VALUES
  ('Burgers', 'Juicy grilled burgers with fresh ingredients', 1),
  ('Pizza', 'Hot and cheesy pizzas', 2),
  ('Shakes', 'Thick and creamy milkshakes', 3),
  ('Pasta', 'Italian-style pasta', 4),
  ('Sandwiches', 'Fresh toasted sandwiches', 5),
  ('Beverages', 'Refreshing drinks and juices', 6),
  ('Fast Food', 'Quick bites and snacks', 7);

-- Seed data: Sample Menu Items (with image_url)
INSERT INTO menu_items (category_id, name, description, price, is_vegetarian, image_url) VALUES
  ((SELECT id FROM categories WHERE name = 'Burgers'), 'Classic Veg Burger', 'Fresh patty with lettuce, tomato, and our special sauce', 99, TRUE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Burgers'), 'Cheese Burger', 'Double cheese with grilled vegetables', 129, TRUE, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Pizza'), 'Margherita Pizza', 'Classic cheese pizza with Italian herbs', 149, TRUE, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Pizza'), 'Farmhouse Pizza', 'Loaded with fresh vegetables and cheese', 199, TRUE, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Shakes'), 'Chocolate Shake', 'Rich chocolate milkshake with cream', 89, TRUE, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Shakes'), 'Strawberry Shake', 'Fresh strawberry milkshake', 89, TRUE, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Shakes'), 'Oreo Shake', 'Crushed Oreo blended with vanilla ice cream', 119, TRUE, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Pasta'), 'White Sauce Pasta', 'Creamy white sauce pasta with veggies', 129, TRUE, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Pasta'), 'Red Sauce Pasta', 'Tangy tomato basil pasta', 129, TRUE, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Sandwiches'), 'Grilled Sandwich', 'Toasted sandwich with veggies and cheese', 79, TRUE, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Sandwiches'), 'Club Sandwich', 'Triple-layer sandwich with fresh fillings', 149, TRUE, 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Beverages'), 'Cold Coffee', 'Chilled coffee with ice cream', 79, TRUE, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Beverages'), 'Fresh Lime Soda', 'Refreshing lime soda - sweet or salty', 49, TRUE, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Beverages'), 'Mango Juice', 'Fresh seasonal mango juice', 69, TRUE, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Fast Food'), 'French Fries', 'Crispy golden french fries', 69, TRUE, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop'),
  ((SELECT id FROM categories WHERE name = 'Fast Food'), 'Veg Nuggets (6 pcs)', 'Crispy vegetable nuggets', 89, TRUE, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop');

-- Seed coupon
INSERT INTO coupons (code, discount_percent, max_discount, min_order, usage_limit, expires_at)
VALUES ('WELCOME20', 20, 50, 150, 100, NOW() + INTERVAL '90 days');
