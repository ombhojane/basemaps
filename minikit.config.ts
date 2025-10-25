const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    allowedAddresses: [],
  },
  miniapp: {
    version: "1",
    name: "basemaps",
    subtitle: "see nearby based people!",
    description: "basemaps is the first location-aware social layer for Base that combines discovery, networking, and onchain transactions in one seamless experience.",
    screenshotUrls: ["https://i.ibb.co/FqNkhzdg/ui1.jpg"],
    iconUrl: "https://i.ibb.co/1GM9VCyx/basemapslogo.jpg",
    splashImageUrl: "https://i.ibb.co/1GM9VCyx/basemapslogo.jpg",
    splashBackgroundColor: "#FFFFFF",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["social", "map", "community", "meetups"],
    heroImageUrl: "https://i.ibb.co/Kp11Q29D/based.jpg",
    tagline: "see nearby based people!",
    ogTitle: "basemaps - based people around",
    ogDescription: "discovery, networking, and onchain transactions of based people",
    ogImageUrl: "https://i.ibb.co/FqNkhzdg/ui1.jpg",
  },
} as const;
