"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { getUserByWallet, upsertUser, getUserTransactions, getUserDisplayName } from "@/lib/supabase-helpers";
import Image from "next/image";

interface Transaction {
  hash: string;
  amount: string;
  recipient_address: string;
  recipient_name: string;
  timestamp: string;
  status: string;
}

// Available avatar options
const AVATAR_OPTIONS = [
  "/pfp/pfp1.jpg",
  "/pfp/pfp2.jpg",
  "/pfp/pfp3.jpg",
  "/pfp/pfp4.jpg",
  "/icon.png",
];

/**
 * Profile page component
 * Shows wallet details, transaction history, and settings
 */
const Profile = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("/icon.png");
  const { address } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch display name (preferred_name > basename > wallet address)
   */
  useEffect(() => {
    const fetchName = async () => {
      if (!address) {
        setDisplayName("");
        setIsLoadingName(false);
        return;
      }

      setIsLoadingName(true);

      try {
        // Get user from database first
        const user = await getUserByWallet(address);
        
        if (user) {
          // Use the same display name logic as everywhere else
          const name = getUserDisplayName(user);
          setDisplayName(name);
        } else {
          // Fallback to wallet address if user doesn't exist
          setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      } catch (error) {
        console.error("Error fetching display name:", error);
        setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchName();
  }, [address]);

  /**
   * Handle scroll to add glassmorphism effect to logo
   */
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = containerRef.current.scrollTop > 20;
        setIsScrolled(scrolled);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  /**
   * Notify parent component about scroll state
   */
  useEffect(() => {
    const event = new CustomEvent("profileScroll", { detail: isScrolled });
    window.dispatchEvent(event);
  }, [isScrolled]);

  /**
   * Load user data and transactions from Supabase
   */
  useEffect(() => {
    if (!address) return;

    const loadUserData = async () => {
      try {
        // Get or create user
        let user = await getUserByWallet(address);
        if (!user) {
          // Assign random avatar if new user
          const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
          user = await upsertUser(address, { avatar: randomAvatar });
        }

        // Set selected avatar (for picker)
        setSelectedAvatar(user.avatar || "/icon.png");

        // Load transactions
        const txData = await getUserTransactions(user.id);
        setTransactions(txData);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
    
    // Refresh every 10 seconds when on profile page
    const interval = setInterval(loadUserData, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [address]);

  /**
   * Handle avatar selection
   */
  const handleAvatarSelect = async (avatar: string) => {
    if (!address) return;
    
    try {
      setSelectedAvatar(avatar);
      await upsertUser(address, { avatar });
      
      // Dispatch event to update profile icon in real-time
      const event = new CustomEvent("avatarUpdated", { detail: avatar });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  return (
    <div className="profile-container" ref={containerRef}>
      {/* Header with settings icon */}
      <div className="profile-header">
        <h2>Profile</h2>
        <button
          className="settings-btn"
          aria-label="Settings"
          onClick={() => setShowSettings(!showSettings)}
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3>Settings</h3>
          
          {/* Avatar Picker */}
          <div className="avatar-picker">
            <h4>Choose Your Avatar</h4>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? "selected" : ""}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <Image
                    src={avatar}
                    alt="Avatar option"
                    width={80}
                    height={80}
                  />
                  {selectedAvatar === avatar && (
                    <div className="avatar-checkmark">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-options">
            <button className="settings-option">
              <span>Notifications</span>
              <span className="toggle-indicator">On</span>
            </button>
            <button className="settings-option">
              <span>Privacy Mode</span>
              <span className="toggle-indicator">Off</span>
            </button>
            <button 
              className="settings-option"
              onClick={() => window.open('https://devfolio.co/projects/basemaps-6f6e', '_blank')}
            >
              <span>About basemaps</span>
            </button>
          </div>
        </div>
      )}

      {/* Wallet section */}
      <div className="profile-section">
        <h3>Wallet</h3>
        <div className="wallet-card">
          {address ? (
            <div className="wallet-address-display">
              <div className="address-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div className="address-info">
                {isLoadingName ? "Loading..." : displayName || `${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
            </div>
          ) : (
            <p className="no-wallet-text">No wallet connected</p>
          )}
        </div>
      </div>

      {/* Transactions section */}
      <div className="profile-section">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <p>No transactions yet</p>
              <span>Start exploring based people on the map</span>
            </div>
          ) : (
            <div className="transaction-items">
              {transactions.map((tx, index) => (
                <div key={tx.hash || index} className="transaction-item">
                  <div className="transaction-icon sent">
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
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </div>
                  <div className="transaction-content">
                    <div className="transaction-header">
                      <div className="transaction-details">
                        <div className="transaction-name">{tx.recipient_name}</div>
                        <div className="transaction-address">
                          {tx.recipient_address.slice(0, 6)}...{tx.recipient_address.slice(-4)}
                        </div>
                        <div className="transaction-time">
                          {new Date(tx.timestamp).toLocaleDateString()},{" "}
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="transaction-amount">
                        -{tx.amount} ETH
                      </div>
                    </div>
                    <div className="transaction-footer">
                      {tx.hash && (
                        <a
                          href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="basescan-link"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          View on BaseScan
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats section */}
      <div className="profile-section">
        <h3>Activity</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{transactions.length}</div>
            <div className="stat-label">Payments sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {transactions
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
                .toFixed(3)}
            </div>
            <div className="stat-label">Total ETH sent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

