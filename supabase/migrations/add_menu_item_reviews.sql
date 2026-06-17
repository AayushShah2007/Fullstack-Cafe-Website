-- Add menu_item_id to reviews table for per-product reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_menu_item ON reviews(menu_item_id);

-- Update RLS: authenticated users can insert their own reviews
DROP POLICY IF EXISTS "users_insert_reviews" ON reviews;
CREATE POLICY "users_insert_reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );
