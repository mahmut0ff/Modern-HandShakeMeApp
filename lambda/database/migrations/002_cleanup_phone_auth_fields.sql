-- Migration: Cleanup phone authentication fields
-- Date: 2026-01-26
-- Description: Remove phone authentication related fields since we're moving to Telegram-only

-- Make phone field nullable (Telegram users don't need phone)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Remove phone verification fields (no longer needed)
ALTER TABLE users DROP COLUMN IF EXISTS verification_code;
ALTER TABLE users DROP COLUMN IF EXISTS verification_code_expiry;

-- Add indexes for Telegram fields if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username);

-- Update comments
COMMENT ON COLUMN users.phone IS 'Phone number (nullable for Telegram-only users)';
COMMENT ON COLUMN users.telegram_id IS 'Telegram user ID for authentication';
COMMENT ON COLUMN users.telegram_username IS 'Telegram username';
COMMENT ON COLUMN users.is_phone_verified IS 'Phone verification status (always true for Telegram users)';