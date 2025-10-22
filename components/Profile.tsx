"use client";

import { useState, useEffect } from "react";
import { getName } from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { base } from "viem/chains";

interface Transaction {
  hash: string;
  amount: string;
  recipient: string;
  recipientName: string;
  timestamp: number;
  status: string;
}

/**
 * Profile page component
 * Shows wallet details, transaction history, and settings
 */
const Profile = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoadingName, setIsLoadingName] = useState(false);
  const { address } = useAccount();

  /**
   * Fetch Basename from Base Mainnet (Basenames only exist on mainnet, not testnet)
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
        // Always check Base Mainnet for Basename (chain ID 8453)
        // Basenames are only on mainnet, not on Sepolia testnet
        const name = await getName({ address, chain: base });
        
        if (name) {
          setDisplayName(name);
        } else {
          // Fallback to shortened address if no Basename found
          setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      } catch (error) {
        console.error("Error fetching Basename:", error);
        setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchName();
  }, [address]);

  /**
   * Load transactions from localStorage on mount
   */
  useEffect(() => {
    const loadTransactions = () => {
      const stored = localStorage.getItem("transactions");
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    };

    loadTransactions();

    // Listen for storage changes (when new transactions are added)
    window.addEventListener("storage", loadTransactions);
    
    // Refresh every 2 seconds when on profile page
    const interval = setInterval(loadTransactions, 2000);

    return () => {
      window.removeEventListener("storage", loadTransactions);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="profile-container">
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
          <div className="settings-options">
            <button className="settings-option">
              <span>Notifications</span>
              <span className="toggle-indicator">On</span>
            </button>
            <button className="settings-option">
              <span>Privacy Mode</span>
              <span className="toggle-indicator">Off</span>
            </button>
            <button className="settings-option">
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
                        <div className="transaction-name">{tx.recipientName}</div>
                        <div className="transaction-address">
                          {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                        </div>
                      </div>
                      <div className="transaction-amount">
                        -{tx.amount} ETH
                      </div>
                    </div>
                    <div className="transaction-footer">
                      <div className="transaction-time">
                        {new Date(tx.timestamp).toLocaleDateString()} at{" "}
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
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

