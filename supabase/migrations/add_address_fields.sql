-- Add missing address columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai';
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Borivali West';
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Add missing address columns to otp_codes table
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai';
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Borivali West';
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS pincode TEXT;
