"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666",
      }}
    >
      Loading map...
    </div>
  ),
});

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header with wallet - positioned absolutely over the map */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          padding: "12px 16px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className="header-bar"
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            margin: 0,
            color: "#0052ff",
          }}
          className="app-title"
        >
          basemaps
        </h1>
        <Wallet />
      </header>

      {/* Map container - takes full viewport */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
        }}
      >
        <Map />
      </div>
    </div>
  );
}
