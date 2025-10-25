import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to Farcaster-hosted manifest (same as /.well-known/farcaster.json)
  return NextResponse.redirect(
    'https://api.farcaster.xyz/miniapps/hosted-manifest/019a1c0d-8048-ea2f-a350-31e693ce2f95',
    307
  );
}

