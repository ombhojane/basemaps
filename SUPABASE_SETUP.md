# Basemaps Supabase Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Project name**: basemaps (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect for getting started
4. Click "Create new project" and wait 2-3 minutes for setup

### 2. Run the SQL Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

### 3. Get Your API Keys

1. In Supabase dashboard, go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

### 4. Add Environment Variables

1. In your basemaps project root, create a file called `.env.local`
2. Add these two lines (replace with your actual values):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

3. Save the file

### 5. Restart Your Dev Server

```bash
npm run dev
```

## ✅ What's Been Migrated

All data is now stored in Supabase instead of localStorage:

- ✅ **Users**: Wallet addresses, basenames, avatars, locations
- ✅ **Chats**: Conversations and messages with real-time updates
- ✅ **Transactions**: Payment history on Base Sepolia
- ✅ **Meetups**: Community events (pre-seeded with sample data)
- ✅ **Meetup Attendees**: Track who's joining events
- ✅ **User Connections**: For future mutual connections feature

## 🗄️ Database Tables Created

1. **users** - User profiles with wallet addresses
2. **conversations** - Chat threads between users
3. **messages** - Individual messages in conversations
4. **transactions** - Blockchain transaction records
5. **meetups** - Community meetup events
6. **meetup_attendees** - Tracks event attendance
7. **user_connections** - Mutual connections (future feature)

## 🔒 Security (Row Level Security)

All tables have RLS policies enabled:
- Users can read all profiles (needed for map discovery)
- Users can only update their own data
- Conversations and messages are visible to participants
- Transactions are public (blockchain data)
- Anyone can view and join meetups

## 🧪 Testing Your Setup

1. **Connect your wallet** in the app
2. **Wave at someone** on the map → Should create a chat conversation
3. **Send a payment** → Should appear in your Profile transactions
4. **Check Chats tab** → You should see the conversation
5. **Open Supabase** → Go to Table Editor and you'll see your data!

## 📊 View Your Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. Click on any table (users, conversations, messages, etc.)
3. You'll see all your data in a spreadsheet-like view
4. You can manually edit, add, or delete rows here

## 🔄 Real-time Updates

The app uses Supabase real-time subscriptions:
- New messages appear instantly
- Conversations update automatically
- No page refresh needed!

## 🐛 Troubleshooting

### "Failed to fetch" errors
- Check your `.env.local` file has the correct values
- Make sure NEXT_PUBLIC_ prefix is there
- Restart dev server after adding env vars

### "Row level security policy violation"
- Go to SQL Editor in Supabase
- Re-run the schema (it includes all RLS policies)

### No data appearing
- Check browser console for errors
- Verify your Supabase URL and key
- Check if tables were created (Table Editor → see all tables)

### Chat/Wave not working
- Make sure you're connected with a wallet
- Check console for specific error messages
- Verify users table has your wallet address

## 🎉 You're All Set!

Your basemaps app is now powered by Supabase! All data persists across sessions and devices.

## 📝 Next Steps

- Add more users to the map (update sample users in Map.tsx)
- Create real meetups in the Supabase Table Editor
- Invite friends to test the app
- Deploy to production with your Supabase credentials

