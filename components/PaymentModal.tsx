"use client";

import { useState, useEffect, useRef } from "react";
import { useSendTransaction, useWaitForTransactionReceipt, useAccount, useConnect } from "wagmi";
import { parseEther } from "viem";
import Image from "next/image";
import { getUserByWallet, upsertUser, addTransaction, sendMessage } from "@/lib/supabase-helpers";

const PRESET_AMOUNTS = [0.01, 0.05, 0.1];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientImage: string;
  recipientAddress: string;
  conversationId?: string;
  currentUserId?: string | null;
}

/**
 * Payment modal component for sending ETH on Base Sepolia testnet
 * Supports preset amounts and custom input
 */
const PaymentModal = ({
  isOpen,
  onClose,
  recipientName,
  recipientImage,
  recipientAddress,
  conversationId,
  currentUserId,
}: PaymentModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const savedTransactions = useRef<Set<string>>(new Set());

  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  const {
    data: hash,
    isPending,
    sendTransaction,
    error,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const amount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount || 0;

  /**
   * Handle successful transaction
   * Stores transaction data in Supabase
   */
  useEffect(() => {
    if (isSuccess && hash && isOpen && address && !savedTransactions.current.has(hash)) {
      console.log("Transaction successful:", hash);

      // Mark this transaction as being saved
      savedTransactions.current.add(hash);

      const saveTransaction = async () => {
        try {
          // Get or create user
          let user = await getUserByWallet(address);
          if (!user) {
            user = await upsertUser(address, { avatar: "/icon.png" });
          }

          // Store transaction in Supabase
          await addTransaction({
            hash,
            sender_id: user.id,
            recipient_address: recipientAddress,
            recipient_name: recipientName,
            amount: amount.toString(),
            status: "success",
            timestamp: new Date().toISOString(),
          });

          console.log("Transaction saved to Supabase");

          // Send payment message to chat if conversationId exists
          if (conversationId && currentUserId) {
            try {
              const paymentMessage = `💸 Paid ${amount} ETH`;
              await sendMessage(conversationId, currentUserId, paymentMessage);
              console.log("Payment message sent to chat");
            } catch (error) {
              console.error("Error sending payment message:", error);
            }
          }
        } catch (error) {
          console.error("Error saving transaction:", error);
        }
      };

      saveTransaction();

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSelectedAmount(null);
        setCustomAmount("");
        setIsCustom(false);
      }, 2000);
    }
  }, [isSuccess, hash, amount, recipientName, recipientAddress, onClose, isOpen, address, conversationId, currentUserId]);

  /**
   * Handle pay button click
   */
  const handlePay = () => {
    if (amount > 0) {
      sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount.toString()),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Send Payment</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Recipient info */}
        <div className="recipient-info">
          <Image
            src={recipientImage}
            alt={recipientName}
            className="recipient-avatar"
            width={48}
            height={48}
          />
          <div className="recipient-details">
            <strong>{recipientName}</strong>
            <span className="recipient-address">
              {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
            </span>
          </div>
        </div>

        {/* Amount selection */}
        <div className="amount-section">
          <label className="section-label">Select Amount (ETH)</label>
          
          {/* Preset amounts */}
          <div className="preset-amounts">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                className={`preset-btn ${
                  !isCustom && selectedAmount === preset ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedAmount(preset);
                  setIsCustom(false);
                  setCustomAmount("");
                }}
              >
                {preset} ETH
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="custom-amount">
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setIsCustom(true);
                setSelectedAmount(null);
              }}
              className="custom-input"
            />
            <span className="input-suffix">ETH</span>
          </div>
        </div>

        {/* Transaction summary */}
        {amount > 0 && (
          <div className="transaction-summary">
            <div className="summary-row">
              <span>Amount</span>
              <strong>{amount} ETH</strong>
            </div>
            <div className="summary-row">
              <span>Network</span>
              <strong>Base Sepolia</strong>
            </div>
            <div className="summary-row">
              <span>Recipient</span>
              <strong>
                {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
              </strong>
            </div>
          </div>
        )}

        {/* Wallet connection check */}
        {!isConnected ? (
          <div className="wallet-connect-section">
            <p className="connect-message">Please connect your wallet to continue</p>
            <div className="wallet-buttons">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  disabled={isConnecting}
                  className="wallet-option-btn"
                >
                  {connector.name}
                  {isConnecting && " (Connecting...)"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Transaction status */}
            {error && (
              <div className="transaction-error">
                <p>Error: {error.message}</p>
              </div>
            )}

            {hash && (
              <div className="transaction-status">
                <p>Transaction Hash: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                {isConfirming && <p>Waiting for confirmation...</p>}
                {isSuccess && <p>✓ Transaction confirmed!</p>}
              </div>
            )}

            {/* Pay button */}
            <button
              className="pay-button"
              onClick={handlePay}
              disabled={amount <= 0 || isPending || isConfirming}
            >
              {isPending
                ? "Confirming..."
                : isConfirming
                ? "Processing..."
                : amount > 0
                ? `Pay ${amount} ETH`
                : "Enter amount"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;

