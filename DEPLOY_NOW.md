# 🚀 Deploy basemaps to Farcaster - READY TO GO!

## ✅ Everything is Configured!

Your app is now fully configured with the Farcaster-hosted manifest!

## 📦 What's Been Set Up:

1. **Redirect Route**: `app/.well-known/farcaster.json/route.ts`
   - Redirects to your Farcaster-hosted manifest (307 redirect)
   
2. **Updated Config**: `minikit.config.ts`
   - Synced with your Farcaster manifest
   - All metadata updated (description, images, tags)

3. **Manifest API**: `app/api/manifest/route.ts`
   - Also redirects to Farcaster-hosted manifest

## 🎯 Deploy Now:

```bash
git add .
git commit -m "Add Farcaster manifest redirect"
git push
```

That's it! Vercel will auto-deploy.

## ✅ After Deployment:

### 1. Test the Redirect
Visit these URLs (should redirect to your Farcaster manifest):
- https://basemaps.vercel.app/.well-known/farcaster.json
- https://basemaps.vercel.app/api/manifest

### 2. Test in Farcaster
1. Open Farcaster mobile app
2. Share this URL: `https://basemaps.vercel.app`
3. It should show as a Mini App with your icon and description
4. Click to launch!

### 3. Share Your App
Your Farcaster manifest URL:
```
https://api.farcaster.xyz/miniapps/hosted-manifest/019a1c0d-8048-ea2f-a350-31e693ce2f95
```

Share your app URL in Farcaster:
```
https://basemaps.vercel.app
```

## 🎨 Your App Details:

- **Name**: basemaps
- **Tagline**: see nearby based people!
- **Description**: basemaps is the first location-aware social layer for Base that combines discovery, networking, and onchain transactions in one seamless experience.
- **Category**: Social
- **Tags**: social, map, community, meetups

## 🔍 Key Features Working:

- ✅ Wallet auto-connect via Farcaster
- ✅ Map view with Based people
- ✅ Wave & Chat functionality
- ✅ Meetups with attendance tracking
- ✅ Onchain transactions
- ✅ Real-time Supabase sync

## 📱 What Users Will See:

When someone opens your app link in Farcaster:
1. They'll see your splash screen (basemaps logo on white)
2. App launches with auto-connected Farcaster wallet
3. They can immediately explore the map, wave, chat, and transact!

## 🎉 You're Live!

Once deployed, your app will be:
- ✅ Discoverable in Farcaster
- ✅ Shareable via casts
- ✅ Integrated with Farcaster identity
- ✅ Part of the Base ecosystem

**Just deploy and you're live on Farcaster! 🚀**

