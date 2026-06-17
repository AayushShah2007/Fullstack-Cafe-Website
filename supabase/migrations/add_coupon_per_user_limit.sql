-- Add per-user usage limit to coupons table
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1;
