import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  wallet_address: string;
  basename?: string;
  preferred_name?: string;
  avatar?: string;
  farcaster_fid?: string;
  farcaster_pfp?: string;
  farcaster_username?: string;
  x_handle?: string;
  latitude?: number;
  longitude?: number;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message?: string;
  last_message_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  timestamp?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface Transaction {
  id?: string;
  hash: string;
  sender_id?: string;
  recipient_address: string;
  recipient_name?: string;
  amount: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
}

export interface Meetup {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  cover_image?: string;
  capacity?: number;
  is_past?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MeetupAttendee {
  id?: string;
  meetup_id: string;
  user_id: string;
  joined_at?: string;
}

