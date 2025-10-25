# How to Publish basemaps on Farcaster & Base

## ✅ Files Already Created

I've set up the necessary files for you:

1. **`public/.well-known/farcaster.json`** - Your Farcaster manifest file
2. **`app/api/manifest/route.ts`** - API endpoint for dynamic manifest
3. **`minikit.config.ts`** - Updated with complete app metadata
4. **`next.config.ts`** - Configured for proper manifest serving

## 📱 Step-by-Step Publishing Guide

### Step 1: Generate Account Association (Required)

You need to generate the `accountAssociation` object using the Farcaster mobile app:

1. Open the **Farcaster mobile app** on your phone
2. Go to **Settings > Developer > Domains**
3. Enter your domain: `basemaps.vercel.app`
4. Tap **"Generate Domain Manifest"**
5. Copy the generated `accountAssociation` object (it will have 3 fields: `header`, `payload`, `signature`)

### Step 2: Update the Account Association

Once you have the `accountAssociation` object, update two files:

**File 1: `minikit.config.ts`** (lines 12-16)
```typescript
accountAssociation: {
  header: "YOUR_HEADER_HERE",
  payload: "YOUR_PAYLOAD_HERE",
  signature: "YOUR_SIGNATURE_HERE",
},
```

**File 2: `public/.well-known/farcaster.json`** (line 12)
```json
"accountAssociation": {
  "header": "YOUR_HEADER_HERE",
  "payload": "YOUR_PAYLOAD_HERE",
  "signature": "YOUR_SIGNATURE_HERE"
}
```

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add Farcaster manifest and configuration"
git push
```

Vercel will automatically deploy your changes to `https://basemaps.vercel.app`

### Step 4: Verify Your Manifest

Once deployed, verify your manifest is accessible:

1. Visit: `https://basemaps.vercel.app/.well-known/farcaster.json`
2. Or: `https://basemaps.vercel.app/api/manifest`

Both should return your app's manifest with the account association.

### Step 5: Test in Farcaster

1. Open Farcaster mobile app
2. Share your app URL: `https://basemaps.vercel.app`
3. The app should be recognized as a Mini App
4. Users can launch it directly from Farcaster

### Step 6: Submit to Base Apps Directory (Optional)

To get listed in the Base Apps directory:

1. Go to: https://base.org/apps
2. Click "Submit an app"
3. Fill in the details:
   - **Name**: basemaps
   - **URL**: https://basemaps.vercel.app
   - **Category**: Social
   - **Description**: Explore Based people around you, see the Based distribution globally, connect via meetups, wave & chat, and transact seamlessly onchain.
   - **Tags**: social, networking, onchain, base, maps, meetups, chat

## 🔍 Validation Checklist

Before publishing, make sure:

- [ ] `accountAssociation` is generated and added to both config files
- [ ] All images (icon.png, splash.png, hero.png, screenshot.png) are in the `public` folder
- [ ] App is deployed and accessible at `https://basemaps.vercel.app`
- [ ] Manifest is accessible at `/.well-known/farcaster.json`
- [ ] Wallet connection works (test the Connect Wallet button)
- [ ] Wave, Chat, and Meetups features work correctly
- [ ] Supabase is configured with proper environment variables

## 🚀 What Happens After Publishing?

Once published:
- Users can discover your app in Farcaster
- They can launch it directly from Farcaster client
- Automatic wallet connection via Farcaster (with `miniKit.autoConnect: true`)
- Your app appears in the Base ecosystem
- Users can share it via Farcaster casts

## 📚 Useful Links

- **Your App**: https://basemaps.vercel.app
- **Your Manifest**: https://basemaps.vercel.app/.well-known/farcaster.json
- **Farcaster Docs**: https://miniapps.farcaster.xyz/docs
- **Base Apps**: https://base.org/apps
- **OnchainKit**: https://onchainkit.xyz

## 🔧 Troubleshooting

**Manifest not loading?**
- Check that `.well-known` folder is in `public/`
- Verify the file is named exactly `farcaster.json`
- Clear your browser cache

**Account Association errors?**
- Make sure you generated it from the Farcaster mobile app
- Verify all 3 fields (header, payload, signature) are filled
- The values should be long strings

**App not opening in Farcaster?**
- Verify your manifest is valid JSON
- Check that `homeUrl` matches your deployment URL
- Test the URL in a browser first

## 🎉 You're Ready!

Once you complete Step 1 & 2 (generating and adding the account association), your app will be ready for Farcaster!

