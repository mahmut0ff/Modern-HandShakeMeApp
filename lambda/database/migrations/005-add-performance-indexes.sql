-- Migration: Add performance indexes
-- Date: 2026-02-07
-- Description: Add missing indexes for frequently queried columns

-- PERFORMANCE FIX: Add index on applications.status
-- Applications are frequently filtered by status (pending, accepted, rejected)
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- PERFORMANCE FIX: Add index on projects.status
-- Projects are frequently filtered by status (active, completed, cancelled)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- PERFORMANCE FIX: Add composite index for chat message queries
-- Chat messages are queried by room_id and ordered by created_at
-- This composite index optimizes pagination queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- PERFORMANCE FIX: Add composite index for order queries
-- Orders are frequently filtered by status and sorted by created_at
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- PERFORMANCE FIX: Add index on notifications created_at for pagination
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- PERFORMANCE FIX: Add composite index for user notifications
-- Frequently query unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_applications_status IS 'Optimizes filtering applications by status';
COMMENT ON INDEX idx_projects_status IS 'Optimizes filtering projects by status';
COMMENT ON INDEX idx_chat_messages_room_created IS 'Optimizes chat message pagination queries';
COMMENT ON INDEX idx_orders_status_created IS 'Optimizes order listing with status filter';
COMMENT ON INDEX idx_notifications_created IS 'Optimizes notification pagination';
COMMENT ON INDEX idx_notifications_user_read_created IS 'Optimizes unread notification queries';
