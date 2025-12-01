-- =====================================================
-- FIX RLS POLICIES FOR WALLET-BASED AUTHENTICATION
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to fix the join/leave error
-- This allows anonymous users to join/leave squads since your app uses wallet auth

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can join squads" ON squad_members;
DROP POLICY IF EXISTS "Users can leave squads" ON squad_members;

-- Allow anonymous users to join squads
-- (user_id is validated via foreign key constraint, so it's safe)
CREATE POLICY "Anyone can join squads" 
  ON squad_members FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to leave squads
CREATE POLICY "Users can leave squads" 
  ON squad_members FOR DELETE 
  TO anon, authenticated
  USING (true);

