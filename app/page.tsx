"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useBalance } from "wagmi";
import { getName } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading map...</p>
    </div>
  ),
});

const Profile = dynamic(() => import("@/components/Profile"), {
  ssr: false,
});

const Meetups = dynamic(() => import("@/components/Meetups"), {
  ssr: false,
});

const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
});

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "meetups" | "profile">("home");
  const [showGlassmorphism, setShowGlassmorphism] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });

  useEffect(() => {
    if (!isMiniAppReady) setMiniAppReady();
  }, [setMiniAppReady, isMiniAppReady]);

  /**
   * Listen for scroll events from Chat, Meetups and Profile pages
   */
  useEffect(() => {
    const handleChatScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowGlassmorphism(customEvent.detail);
    };

    const handleMeetupsScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowGlassmorphism(customEvent.detail);
    };

    const handleProfileScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowGlassmorphism(customEvent.detail);
    };

    window.addEventListener("chatScroll", handleChatScroll);
    window.addEventListener("meetupsScroll", handleMeetupsScroll);
    window.addEventListener("profileScroll", handleProfileScroll);

    return () => {
      window.removeEventListener("chatScroll", handleChatScroll);
      window.removeEventListener("meetupsScroll", handleMeetupsScroll);
      window.removeEventListener("profileScroll", handleProfileScroll);
    };
  }, []);

  /**
   * Reset glassmorphism when changing tabs
   */
  useEffect(() => {
    setShowGlassmorphism(false);
  }, [activeTab]);

  /**
   * Fetch Basename for account display
   */
  useEffect(() => {
    const fetchName = async () => {
      if (!address) {
        setDisplayName("");
        return;
      }

      try {
        const name = await getName({ address, chain: base });
        if (name) {
          setDisplayName(name);
        } else {
          setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      } catch (error) {
        console.error("Error fetching Basename:", error);
        setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    };

    fetchName();
  }, [address]);

  return (
    <div className="app-container">
      {/* Top bar with logo and profile */}
      <div className="top-bar">
        <div className={`basemaps-logo ${showGlassmorphism ? "scrolled" : ""}`}>
          basemaps
        </div>

        {address && (
          <div className="profile-icon-container">
            <button
              className="profile-icon-btn"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              aria-label="Account"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            {showAccountDropdown && (
              <>
                <div
                  className="dropdown-overlay"
                  onClick={() => setShowAccountDropdown(false)}
                ></div>
                <div className="account-dropdown">
                  <div className="account-dropdown-header">
                    <span className="account-label">Account</span>
                  </div>

                  <div className="account-info">
                    <div className="account-row">
                      <span className="account-field">Basename</span>
                      <span className="account-value">{displayName}</span>
                    </div>

                    <div className="account-row">
                      <span className="account-field">Wallet ID</span>
                      <span className="account-value account-address">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    </div>

                    <div className="account-row">
                      <span className="account-field">Balance</span>
                      <span className="account-value">
                        {balanceData
                          ? `${parseFloat(balanceData.formatted).toFixed(4)} ${
                              balanceData.symbol
                            }`
                          : "0.0000 ETH"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {/* Main content */}
      <div className="main-content">
        {activeTab === "home" && <Map />}
        {activeTab === "chat" && <Chat />}
        {activeTab === "meetups" && <Meetups />}
        {activeTab === "profile" && <Profile />}
      </div>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
          aria-label="Home"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </button>

        <button
          className={`nav-item ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
          aria-label="Chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Chat</span>
        </button>

        <button
          className={`nav-item ${activeTab === "meetups" ? "active" : ""}`}
          onClick={() => setActiveTab("meetups")}
          aria-label="Meetups"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Meetups</span>
        </button>

        <button
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          aria-label="Profile"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
