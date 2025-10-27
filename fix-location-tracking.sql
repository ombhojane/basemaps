-- =====================================================
-- LOCATION TRACKING FIX - SQL SCRIPT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Verify the users table has location columns
-- This should return the schema with latitude and longitude columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('latitude', 'longitude', 'last_seen');

-- Step 2: Check existing users and their locations
-- See which users have locations saved
SELECT 
  wallet_address,
  basename,
  latitude,
  longitude,
  last_seen,
  created_at
FROM users
ORDER BY last_seen DESC NULLS LAST;

-- Step 3: Verify indexes exist for better performance
-- Check if location index exists
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname = 'idx_users_location';

-- Step 4: Create a function to get users within a radius (optional - for future use)
-- This allows finding nearby users based on location
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  basename TEXT,
  avatar TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.wallet_address,
    u.basename,
    u.avatar,
    u.latitude,
    u.longitude,
    -- Calculate distance using Haversine formula
    (
      6371 * acos(
        LEAST(1.0, 
          cos(radians(user_lat)) * 
          cos(radians(u.latitude)) * 
          cos(radians(u.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(u.latitude))
        )
      )
    )::DECIMAL AS distance_km
  FROM users u
  WHERE u.latitude IS NOT NULL 
    AND u.longitude IS NOT NULL
    AND (
      6371 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * 
          cos(radians(u.latitude)) * 
          cos(radians(u.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(u.latitude))
        )
      )
    ) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Test the nearby users function (Mumbai coordinates as example)
-- Mumbai coordinates: 19.0760, 72.8777
-- This will return users within 50km of Mumbai
SELECT * FROM get_nearby_users(19.0760, 72.8777, 50);

-- Step 6: Count users with and without locations
SELECT 
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as users_with_location,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as users_without_location,
  COUNT(*) as total_users
FROM users;

-- Step 7: Optional - Clean up any duplicate or invalid data
-- Remove users without wallet addresses (shouldn't happen but just in case)
DELETE FROM users WHERE wallet_address IS NULL OR wallet_address = '';

-- =====================================================
-- TESTING SECTION (Optional - for verification)
-- =====================================================

-- Insert a test user with Mumbai location
-- You can run this to test if the system works
/*
INSERT INTO users (wallet_address, basename, avatar, latitude, longitude, last_seen)
VALUES 
  ('0xTEST_MUMBAI_USER_123', 'Mumbai Tester', '/icon.png', 19.0760, 72.8777, NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  last_seen = EXCLUDED.last_seen;
*/

-- Verify test user was created
-- SELECT * FROM users WHERE wallet_address = '0xTEST_MUMBAI_USER_123';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Users must allow location access in their browser
-- 2. Location is saved when they connect wallet and open the map
-- 3. Location updates every time they access the map
-- 4. All users with saved locations will be visible on the map
-- 5. Users can see other users regardless of which wallet they connect with


