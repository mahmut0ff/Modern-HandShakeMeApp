-- Migration: Add UNIQUE constraints to profile tables
-- Date: 2026-02-07
-- Description: Enforce 1:1 relationship between users and profiles

-- CRITICAL FIX: Add UNIQUE constraint to master_profiles.user_id
-- This prevents a user from having multiple master profiles
ALTER TABLE master_profiles 
ADD CONSTRAINT uk_master_profiles_user_id UNIQUE (user_id);

-- CRITICAL FIX: Add UNIQUE constraint to client_profiles.user_id
-- This prevents a user from having multiple client profiles
ALTER TABLE client_profiles 
ADD CONSTRAINT uk_client_profiles_user_id UNIQUE (user_id);

-- Add comments for documentation
COMMENT ON CONSTRAINT uk_master_profiles_user_id ON master_profiles IS 'Ensures one master profile per user';
COMMENT ON CONSTRAINT uk_client_profiles_user_id ON client_profiles IS 'Ensures one client profile per user';
