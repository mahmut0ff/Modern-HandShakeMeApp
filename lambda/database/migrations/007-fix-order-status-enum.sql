-- Migration: Fix order_status enum to match frontend expectations
-- Date: 2026-02-07
-- Description: Add 'ACTIVE' status and migrate 'PUBLISHED' to 'ACTIVE'

-- CRITICAL FIX: Add 'ACTIVE' to order_status enum
-- Frontend expects 'active' status, but backend only has 'PUBLISHED'
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ACTIVE';

-- Migrate existing 'PUBLISHED' orders to 'ACTIVE'
-- This ensures consistency between frontend and backend
UPDATE orders 
SET status = 'ACTIVE' 
WHERE status = 'PUBLISHED';

-- Note: We keep 'PUBLISHED' in the enum for backward compatibility
-- but new orders should use 'ACTIVE' status

-- Add comment for documentation
COMMENT ON TYPE order_status IS 'Order status: DRAFT (not published), ACTIVE (published and accepting applications), IN_PROGRESS (work started), COMPLETED (finished), CANCELLED (cancelled by client)';
