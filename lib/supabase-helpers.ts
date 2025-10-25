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

export async function upsertUser(walletAddress: string, data?: Partial<User>) {
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

