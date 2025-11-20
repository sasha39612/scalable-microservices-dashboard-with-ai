-- Migration: Add refresh token column to users table
-- Date: 2025-11-20
-- Description: Adds a nullable refreshToken column to store hashed refresh tokens

-- Add refreshToken column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;

-- Add index for faster refresh token lookups
CREATE INDEX IF NOT EXISTS idx_users_refresh_token 
ON users ("refreshToken");

-- Comment on column
COMMENT ON COLUMN users."refreshToken" IS 'Hashed refresh token for JWT token rotation';
