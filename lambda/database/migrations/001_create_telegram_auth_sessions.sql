-- Migration: Create telegram_auth_sessions table
-- Date: 2026-01-26
-- Description: Table for storing Telegram authentication sessions and codes

CREATE TABLE IF NOT EXISTS telegram_auth_sessions (
    id SERIAL PRIMARY KEY,
    visitor_id VARCHAR(255) NOT NULL,
    code VARCHAR(4) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_auth_code ON telegram_auth_sessions(code, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_visitor ON telegram_auth_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_user ON telegram_auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_expires ON telegram_auth_sessions(expires_at);

-- Add comments for documentation
COMMENT ON TABLE telegram_auth_sessions IS 'Stores Telegram authentication sessions and verification codes';
COMMENT ON COLUMN telegram_auth_sessions.visitor_id IS 'Unique identifier for the authentication session';
COMMENT ON COLUMN telegram_auth_sessions.code IS '4-digit verification code sent to user';
COMMENT ON COLUMN telegram_auth_sessions.user_id IS 'Associated user ID after successful authentication';
COMMENT ON COLUMN telegram_auth_sessions.is_used IS 'Whether the code has been used for authentication';
COMMENT ON COLUMN telegram_auth_sessions.expires_at IS 'When the code expires (10 minutes from creation)';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_telegram_auth_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_telegram_auth_sessions_updated_at
    BEFORE UPDATE ON telegram_auth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_auth_sessions_updated_at();