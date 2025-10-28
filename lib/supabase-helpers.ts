import { supabase, User, Transaction } from './supabase';

// Supabase realtime payload type
interface RealtimePayload {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

// =====================================================
// USER FUNCTIONS
// =====================================================

/**
 * Fetch Farcaster profile by wallet address using Neynar API
 * Uses bulk-by-address endpoint to get user data including FID and profile picture
 */
export async function getFarcasterByWallet(walletAddress: string): Promise<{ fid: string; pfp: string; username?: string } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS';
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${walletAddress}`;
    
    console.log(`Fetching Farcaster profile for wallet: ${walletAddress.slice(0, 6)}...`);
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey
      }
    });
    
    if (!response.ok) {
      console.log(`Neynar API returned status ${response.status} for ${walletAddress.slice(0, 6)}`);
      return null;
    }
    
    const data = await response.json();
    const addressKey = walletAddress.toLowerCase();
    
    if (data && data[addressKey] && data[addressKey][0]) {
      const user = data[addressKey][0];
      const farcasterData = {
        fid: user.fid?.toString() || '',
        pfp: user.pfp_url || '',
        username: user.username || ''
      };
      
      console.log(`✓ Found Farcaster profile for ${walletAddress.slice(0, 6)}:`, farcasterData);
      return farcasterData;
    }
    
    console.log(`No Farcaster profile found for ${walletAddress.slice(0, 6)}`);
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster profile by wallet:', error);
    return null;
  }
}

export async function upsertUser(walletAddress: string, data?: Partial<User>) {
  // Always try to fetch/refresh Farcaster profile data
  // This ensures we have the latest Farcaster PFP
  try {
    const farcasterData = await getFarcasterByWallet(walletAddress);
    if (farcasterData) {
      console.log(`✓ Integrating Farcaster profile for ${walletAddress.slice(0, 6)}`);
      data = {
        ...data,
        farcaster_fid: farcasterData.fid,
        farcaster_pfp: farcasterData.pfp
      };
    }
  } catch {
    console.log(`No Farcaster profile for ${walletAddress.slice(0, 6)}`);
  }

  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      wallet_address: walletAddress,
      ...data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'wallet_address'
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Fetch Farcaster profile image by FID
 */
export async function getFarcasterProfileImage(fid: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.users && data.users[0]?.pfp_url) {
      return data.users[0].pfp_url;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster profile:', error);
    return null;
  }
}

/**
 * Get best available avatar for user
 * Priority: Farcaster PFP > Custom Avatar > Default
 * Farcaster integration prioritizes onchain identity
 */
export function getUserAvatar(user: User): string {
  // PRIORITY 1: Farcaster profile picture (onchain identity)
  if (user.farcaster_pfp) {
    console.log(`✓ Farcaster PFP for ${user.wallet_address.slice(0, 6)}: ${user.farcaster_pfp.slice(0, 50)}...`);
    return user.farcaster_pfp;
  }
  
  // PRIORITY 2: Custom selected avatar from settings
  if (user.avatar) {
    console.log(`✓ Custom avatar for ${user.wallet_address.slice(0, 6)}: ${user.avatar}`);
    return user.avatar;
  }
  
  // PRIORITY 3: Default fallback
  console.log(`✓ Default avatar for ${user.wallet_address.slice(0, 6)}`);
  return '/icon.png';
}

/**
 * Get best available display name for user
 * Priority: Preferred Name > Basename > Farcaster Username > Wallet Address
 */
export function getUserDisplayName(user: User): string {
  // PRIORITY 1: User's preferred name (custom onboarding input)
  if (user.preferred_name) {
    return user.preferred_name;
  }
  
  // PRIORITY 2: Basename (onchain identity)
  if (user.basename) {
    return user.basename;
  }
  
  // PRIORITY 3: Farcaster username
  if (user.farcaster_username) {
    return user.farcaster_username;
  }
  
  // PRIORITY 4: Shortened wallet address
  return `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
}

export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateUserLocation(walletAddress: string, latitude: number, longitude: number) {
  const { error } = await supabase
    .from('users')
    .update({
      latitude,
      longitude,
      last_seen: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress);

  if (error) throw error;
}

export async function getUsersWithLocations() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('last_seen', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =====================================================
// CONVERSATION FUNCTIONS
// =====================================================

export async function getOrCreateConversation(user1Id: string, user2Id: string) {
  // Try to find existing conversation (in either direction)
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(participant1_id.eq.${user1Id},participant2_id.eq.${user2Id}),and(participant1_id.eq.${user2Id},participant2_id.eq.${user1Id})`)
    .single();

  if (existing) return existing;

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant1_id: user1Id,
      participant2_id: user2Id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:users!conversations_participant1_id_fkey(*),
      participant2:users!conversations_participant2_id_fkey(*)
    `)
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('last_message_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateConversation(conversationId: string, lastMessage: string) {
  const { error } = await supabase
    .from('conversations')
    .update({
      last_message: lastMessage,
      last_message_time: new Date().toISOString()
    })
    .eq('id', conversationId);

  if (error) throw error;
}

// =====================================================
// MESSAGE FUNCTIONS
// =====================================================

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation's last message
  await updateConversation(conversationId, text);

  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(*)
    `)
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
}

// =====================================================
// TRANSACTION FUNCTIONS
// =====================================================

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('sender_id', userId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =====================================================
// MEETUP FUNCTIONS
// =====================================================

export async function getAllMeetups() {
  const { data, error } = await supabase
    .from('meetups')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMeetupAttendees(meetupId: string) {
  const { data, error } = await supabase
    .from('meetup_attendees')
    .select(`
      *,
      user:users(*)
    `)
    .eq('meetup_id', meetupId);

  if (error) throw error;
  return data || [];
}

export async function joinMeetup(meetupId: string, userId: string) {
  const { data, error } = await supabase
    .from('meetup_attendees')
    .insert({
      meetup_id: meetupId,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    // If already joined, ignore the error
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

export async function leaveMeetup(meetupId: string, userId: string) {
  const { error } = await supabase
    .from('meetup_attendees')
    .delete()
    .eq('meetup_id', meetupId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getUserMeetups(userId: string) {
  const { data, error } = await supabase
    .from('meetup_attendees')
    .select(`
      meetup:meetups(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(item => item.meetup) || [];
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export function subscribeToConversations(userId: string, callback: (payload: RealtimePayload) => void) {
  return supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant1_id=eq.${userId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant2_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToMessages(conversationId: string, callback: (payload: RealtimePayload) => void) {
  return supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe();
}

