-- Update orders payment_method CHECK constraint to include 'cash'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('upi', 'card', 'cash'));

-- Update coupons table to include per_user_limit if not exists
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 0;
