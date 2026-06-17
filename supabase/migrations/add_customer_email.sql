-- Add customer_email column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
