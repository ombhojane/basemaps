-- Add Farcaster columns to users table
-- Run this in Supabase SQL Editor

-- Add farcaster_fid column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS farcaster_fid TEXT;

-- Add farcaster_pfp column  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS farcaster_pfp TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_farcaster_fid ON users(farcaster_fid);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('farcaster_fid', 'farcaster_pfp');

-- Check users
SELECT wallet_address, basename, avatar, farcaster_fid, farcaster_pfp
FROM users
ORDER BY created_at DESC
LIMIT 10;

