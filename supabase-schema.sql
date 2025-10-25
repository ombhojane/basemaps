-- =====================================================
-- BASEMAPS SUPABASE DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- Stores user profiles with wallet addresses and locations
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  basename TEXT,
  avatar TEXT DEFAULT '/icon.png',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster wallet address lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_location ON users(latitude, longitude);

-- =====================================================
-- CONVERSATIONS TABLE
-- Stores chat conversations between users
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Index for faster conversation lookups
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX idx_conversations_time ON conversations(last_message_time DESC);

-- =====================================================
-- MESSAGES TABLE
-- Stores individual messages within conversations
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster message queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, timestamp DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- =====================================================
-- TRANSACTIONS TABLE
-- Stores blockchain transactions
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash TEXT UNIQUE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_address TEXT NOT NULL,
  recipient_name TEXT,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for transaction lookups
CREATE INDEX idx_transactions_sender ON transactions(sender_id, timestamp DESC);
CREATE INDEX idx_transactions_hash ON transactions(hash);

-- =====================================================
-- MEETUPS TABLE
-- Stores community meetup events
-- =====================================================
CREATE TABLE meetups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  cover_image TEXT,
  capacity INTEGER DEFAULT 100,
  is_past BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for meetup queries
CREATE INDEX idx_meetups_date ON meetups(is_past, date);

-- =====================================================
-- MEETUP_ATTENDEES TABLE
-- Tracks which users are attending which meetups
-- =====================================================
CREATE TABLE meetup_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meetup_id UUID REFERENCES meetups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meetup_id, user_id)
);

-- Index for attendee lookups
CREATE INDEX idx_attendees_meetup ON meetup_attendees(meetup_id);
CREATE INDEX idx_attendees_user ON meetup_attendees(user_id);

-- =====================================================
-- USER_CONNECTIONS TABLE
-- Tracks mutual connections between users
-- =====================================================
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id1 UUID REFERENCES users(id) ON DELETE CASCADE,
  user_id2 UUID REFERENCES users(id) ON DELETE CASCADE,
  is_mutual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id1, user_id2)
);

-- Index for connection lookups
CREATE INDEX idx_connections_users ON user_connections(user_id1, user_id2);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetups_updated_at BEFORE UPDATE ON meetups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Public read access for users (everyone can see other users)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Conversations are viewable by participants
CREATE POLICY "Conversations viewable by participants" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE USING (true);

-- Messages are viewable by conversation participants
CREATE POLICY "Messages viewable by everyone" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can send messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Transactions viewable by everyone (public blockchain data)
CREATE POLICY "Transactions viewable by everyone" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- Meetups viewable by everyone
CREATE POLICY "Meetups viewable by everyone" ON meetups
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create meetups" ON meetups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update meetups" ON meetups
  FOR UPDATE USING (true);

-- Meetup attendees viewable by everyone
CREATE POLICY "Attendees viewable by everyone" ON meetup_attendees
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join meetups" ON meetup_attendees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can leave meetups" ON meetup_attendees
  FOR DELETE USING (true);

-- User connections viewable by everyone
CREATE POLICY "Connections viewable by everyone" ON user_connections
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create connections" ON user_connections
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED DATA (Sample Meetups)
-- =====================================================

INSERT INTO meetups (title, description, date, time, location, cover_image, capacity, is_past) VALUES
('Base Around the World', 'Join us for a global gathering of Base community members to share experiences, insights, and build connections across continents. This virtual event brings together builders, creators, and enthusiasts from every corner of the globe.', 'November 15, 2025', '3:00 PM UTC', 'Virtual Event', '/hero.png', 500, false),
('Base Onchain Hackathon Dinner', 'Celebrate the conclusion of our onchain hackathon with an exclusive dinner featuring project showcases, networking opportunities, and insights from Base ecosystem leaders. Meet fellow builders and share your journey.', 'December 5, 2025', '7:00 PM PST', '123 Blockchain Ave, San Francisco, CA', '/screenshot.png', 100, false),
('Base Builder Meetup - NYC', 'Connect with the Base community in New York City! An evening of demos, discussions, and networking with local builders pushing the boundaries of onchain innovation. Food and drinks provided.', 'October 10, 2025', '6:00 PM EST', 'Base HQ, New York, NY', '/hero.png', 75, true);

