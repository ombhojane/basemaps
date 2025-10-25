import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sourceCodePro = Source_Code_Pro({ variable: "--font-source-code-pro", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const appName = minikitConfig.miniapp.name;
  const config = minikitConfig.miniapp;
  
  return {
    title: config.ogTitle || appName,
    description: config.ogDescription || config.description,
    metadataBase: new URL(config.homeUrl),
    openGraph: {
      title: config.ogTitle || appName,
      description: config.ogDescription || config.description,
      images: [config.ogImageUrl],
      siteName: appName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.ogTitle || appName,
      description: config.ogDescription || config.description,
      images: [config.ogImageUrl],
    },
    manifest: '/.well-known/farcaster.json',
    other: {
      "fc:miniapp": JSON.stringify({
        version: config.version,
        imageUrl: config.heroImageUrl,
        button: {
          title: `Launch ${appName}`,
          action: {
            name: `Launch ${appName}`,
            type: "launch_miniapp",
          },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
