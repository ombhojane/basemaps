# Testing Guide - Location Tracking Fix

## Quick Test Steps

### Test 1: Save Your Location
1. Open your app and connect wallet
2. Go to Map tab
3. Allow location access when prompted
4. Check browser console - should see: `"Location saved to database"`
5. Go to Supabase Dashboard → Table Editor → `users` table
6. Find your wallet address → Check `latitude` and `longitude` columns have values

### Test 2: See Your Location on Another Device
1. **On Device A**: Connect Wallet #1, allow location (e.g., Mumbai)
2. **On Device B**: Connect different Wallet #2, allow location
3. **On Device B**: You should see a marker for Wallet #1 in Mumbai region
4. Click the marker → Should show Wallet #1's details
5. Can wave or send payment to that user

### Test 3: Run SQL Verification
1. Go to Supabase → SQL Editor
2. Copy and paste contents from `fix-location-tracking.sql`
3. Run the script
4. Check results:
   - Should see your wallet with lat/lng in results
   - Count of users with locations should be > 0

## What to Check

### ✅ Location Saved
- Browser console shows: `"Location saved to database"`
- Supabase `users` table has your wallet with lat/lng values
- `last_seen` timestamp is recent

### ✅ Map Shows Database Users  
- Map displays users from database (not Alice, Bob, Charlie, Diana)
- Each user appears at their actual saved coordinates
- User info shows wallet address or basename

### ✅ Cross-Device/Wallet Works
- Different wallets can see each other
- Location persists across sessions
- No hardcoded sample data

## Troubleshooting

### "No users visible on map"
- Check Supabase `users` table - do users have lat/lng?
- Make sure you allowed location access
- Check browser console for errors

### "Location not saving"
- Ensure wallet is connected BEFORE opening map
- Check browser location permission (not blocked)
- Verify Supabase credentials in `.env.local`

### "Still seeing Alice, Bob, Charlie, Diana"
- Clear browser cache
- Restart dev server
- Check if changes were saved to `Map.tsx`

## Expected Behavior

### First Time User:
1. Connect wallet → User created in DB
2. Open map → Location requested
3. Allow location → Lat/lng saved to DB
4. Map shows "You are here" + other users from DB

### Returning User:
1. Connect wallet → Existing user found
2. Open map → Location updated in DB
3. `last_seen` timestamp refreshed
4. Map shows all users (including new ones)

### Different Wallet:
1. Connect different wallet → New user in DB
2. Queries same database → Sees all users
3. Previous wallet location still visible
4. Can interact with all users

## Success Criteria

✅ Your location saved to database
✅ Other users visible on map from database  
✅ No hardcoded sample users
✅ Location persists across devices
✅ Different wallets can see each other
✅ SQL verification shows users with locations

---

**Note**: Each wallet address = unique user. Location updates every time map loads.

