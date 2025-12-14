-- =====================================================
-- SQUADS (Community/Chapter) Tables
-- =====================================================

-- Create squads table for FBI Squads / Web3 Communities
CREATE TABLE IF NOT EXISTS squads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(500) DEFAULT '/base-icon.svg',
  cover_image VARCHAR(500),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  telegram_link VARCHAR(500),
  twitter_handle VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create squad_members junction table
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'lead', 'co-lead')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(squad_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_squads_location ON squads(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_squads_city ON squads(city);
CREATE INDEX IF NOT EXISTS idx_squads_country ON squads(country);
CREATE INDEX IF NOT EXISTS idx_squads_active ON squads(is_active);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);

-- Enable Row Level Security
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for squads (public read, authenticated write)
CREATE POLICY "Squads are viewable by everyone" 
  ON squads FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert squads" 
  ON squads FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update squads" 
  ON squads FOR UPDATE 
  TO authenticated 
  USING (true);

-- RLS Policies for squad_members
CREATE POLICY "Squad members are viewable by everyone" 
  ON squad_members FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can join squads" 
  ON squad_members FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can leave squads" 
  ON squad_members FOR DELETE 
  TO authenticated 
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_squad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON squads
  FOR EACH ROW
  EXECUTE FUNCTION update_squad_updated_at();



