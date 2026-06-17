-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_approved" ON reviews
  FOR SELECT USING (is_approved = TRUE OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON settings FOR SELECT USING (TRUE);

CREATE POLICY "admin_write_settings" ON settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('store_name', 'Eat O''Clock'),
  ('address', 'Shop 2A, Mani Bhavan, Opp. Ganjaawala Garden, SVP Road, Borivali West, Mumbai'),
  ('phone', '+91 8655551199'),
  ('open_time', '4:30 PM'),
  ('close_time', '11:00 PM'),
  ('delivery_charge', '20'),
  ('tax_percent', '5')
ON CONFLICT (key) DO NOTHING;
