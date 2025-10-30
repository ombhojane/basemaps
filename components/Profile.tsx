"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { getUserByWallet, upsertUser, getUserTransactions } from "@/lib/supabase-helpers";
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
  const [xHandle, setXHandle] = useState<string>("");
  const [farcasterUsername, setFarcasterUsername] = useState<string>("");
  const [initialXHandle, setInitialXHandle] = useState<string>("");
  const [initialFarcasterUsername, setInitialFarcasterUsername] = useState<string>("");
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [socialsSaveStatus, setSocialsSaveStatus] = useState<"idle" | "success" | "error">("idle");

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
          // Priority: basename > preferred_name > wallet address
          const name = user.basename || user.preferred_name || `${address.slice(0, 6)}...${address.slice(-4)}`;
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

        // Socials
        setXHandle(user.x_handle || "");
        setFarcasterUsername(user.farcaster_username || "");
        setInitialXHandle(user.x_handle || "");
        setInitialFarcasterUsername(user.farcaster_username || "");

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

      {/* Social Handles Section */}
      <div className="profile-section">
        <h3>Social Handles</h3>
        <div className="social-handles-card">
          <div className="social-input-group">
            <div className="social-label-row">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
              <label>X (Twitter)</label>
            </div>
            <div className="social-input-wrapper">
              <input
                type="text"
                className={`social-input ${xHandle !== initialXHandle ? 'changed' : ''}`}
                placeholder="your_handle"
                value={xHandle}
                onChange={(e) => {
                  setXHandle(e.target.value.replace(/^@/, ''));
                  setSocialsSaveStatus("idle");
                }}
              />
              {xHandle !== initialXHandle && (
                <span className="change-indicator">●</span>
              )}
            </div>
            <p className="social-hint">Your X username (without @)</p>
          </div>

          <div className="social-input-group">
            <div className="social-label-row">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <label>Farcaster</label>
            </div>
            <div className="social-input-wrapper">
              <input
                type="text"
                className={`social-input ${farcasterUsername !== initialFarcasterUsername ? 'changed' : ''}`}
                placeholder="username"
                value={farcasterUsername}
                onChange={(e) => {
                  setFarcasterUsername(e.target.value.replace(/^@/, ''));
                  setSocialsSaveStatus("idle");
                }}
              />
              {farcasterUsername !== initialFarcasterUsername && (
                <span className="change-indicator">●</span>
              )}
            </div>
            <p className="social-hint">Your Farcaster username (without @)</p>
          </div>

          {/* Status Message */}
          {socialsSaveStatus === "success" && (
            <div className="social-status-message success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Social handles saved successfully!</span>
            </div>
          )}
          {socialsSaveStatus === "error" && (
            <div className="social-status-message error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>Failed to save. Please try again.</span>
            </div>
          )}

          <button
            className={`social-save-btn ${
              xHandle === initialXHandle && farcasterUsername === initialFarcasterUsername 
                ? 'disabled' 
                : socialsSaveStatus === "success" 
                ? 'success' 
                : ''
            }`}
            disabled={
              isSavingSocials || 
              (xHandle === initialXHandle && farcasterUsername === initialFarcasterUsername)
            }
            onClick={async () => {
              if (!address) return;
              
              setIsSavingSocials(true);
              setSocialsSaveStatus("idle");
              
              try {
                await upsertUser(address, {
                  x_handle: xHandle.trim() || undefined,
                  farcaster_username: farcasterUsername.trim() || undefined,
                });
                
                // Update initial values after successful save
                setInitialXHandle(xHandle.trim());
                setInitialFarcasterUsername(farcasterUsername.trim());
                setSocialsSaveStatus("success");
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                  setSocialsSaveStatus("idle");
                }, 3000);
              } catch (error) {
                console.error("Error saving social handles:", error);
                setSocialsSaveStatus("error");
                
                // Clear error message after 4 seconds
                setTimeout(() => {
                  setSocialsSaveStatus("idle");
                }, 4000);
              } finally {
                setIsSavingSocials(false);
              }
            }}
          >
            {isSavingSocials ? (
              <>
                <span className="btn-spinner"></span>
                Saving...
              </>
            ) : socialsSaveStatus === "success" ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Saved!
              </>
            ) : xHandle === initialXHandle && farcasterUsername === initialFarcasterUsername ? (
              "No Changes"
            ) : (
              "Save Social Handles"
            )}
          </button>
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

