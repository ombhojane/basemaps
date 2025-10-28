"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import PaymentModal from "./PaymentModal";
import {
  getUserByWallet,
  upsertUser,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  subscribeToConversations,
  subscribeToMessages,
} from "@/lib/supabase-helpers";

// Available avatar options
const AVATAR_OPTIONS = [
  "/pfp/pfp1.jpg",
  "/pfp/pfp2.jpg",
  "/pfp/pfp3.jpg",
  "/pfp/pfp4.jpg",
  "/icon.png",
];

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userWalletAddress: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  messages: Message[];
}

// Supabase message structure from database
interface SupabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  is_read?: boolean;
  created_at?: string;
}

/**
 * Chat page component with Supabase integration
 * Shows conversations and allows messaging with users
 */
const Chat = () => {
  const { address } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  /**
   * Initialize user and load conversations from Supabase
   */
  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        // Get or create user
        let user = await getUserByWallet(address);
        if (!user) {
          // Assign random avatar to new user
          const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
          user = await upsertUser(address, {
            avatar: randomAvatar,
          });
        }
        setCurrentUserId(user.id);

        // Load conversations
        await loadConversations(user.id);
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [address]);

  /**
   * Load conversations from Supabase
   */
  const loadConversations = async (userId: string) => {
    try {
      const data = await getUserConversations(userId);

      const formattedConversations: Conversation[] = await Promise.all(
        data.map(async (conv: Record<string, unknown>) => {
          const otherUser = (conv.participant1_id === userId ? conv.participant2 : conv.participant1) as {
            id: string;
            wallet_address: string;
            basename?: string;
            avatar?: string;
          };
          const messages = await getConversationMessages(conv.id as string);

          return {
            id: conv.id as string,
            userId: otherUser.id,
            userName: otherUser.basename || `${otherUser.wallet_address.slice(0, 6)}...${otherUser.wallet_address.slice(-4)}`,
            userAvatar: otherUser.avatar || "/icon.png",
            userWalletAddress: otherUser.wallet_address,
            lastMessage: (conv.last_message as string) || "",
            lastMessageTime: (conv.last_message_time as string) || (conv.created_at as string),
            unread: false,
            messages: messages.map((msg: SupabaseMessage) => ({
              id: msg.id,
              text: msg.text,
              timestamp: msg.timestamp,
              senderId: msg.sender_id,
              senderName: msg.sender_id === userId ? "You" : otherUser.basename || "User",
            })),
          };
        })
      );

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  /**
   * Subscribe to real-time updates for conversations
   */
  useEffect(() => {
    if (!currentUserId) return;

    const subscription = subscribeToConversations(currentUserId, () => {
      loadConversations(currentUserId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  /**
   * Subscribe to real-time messages for selected conversation
   */
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    // Load initial messages
    const loadInitialMessages = async () => {
      const messages = await getConversationMessages(selectedConversation.id);
      
      setSelectedConversation(prev => {
        if (!prev || prev.id !== selectedConversation.id) return prev;
        return {
          ...prev,
          messages: messages.map((msg: SupabaseMessage) => ({
            id: msg.id,
            text: msg.text,
            timestamp: msg.timestamp,
            senderId: msg.sender_id,
            senderName: msg.sender_id === currentUserId ? "You" : prev.userName,
          })),
        };
      });
    };

    loadInitialMessages();

    // Subscribe to new messages
    const subscription = subscribeToMessages(selectedConversation.id, async (payload) => {
      const newMessage = payload.new as unknown as SupabaseMessage;
      
      setSelectedConversation(prev => {
        if (!prev || prev.id !== selectedConversation.id) return prev;
        
        // Remove any temp messages and add the real message
        const filteredMessages = prev.messages.filter(m => !m.id.startsWith('temp-'));
        
        // Check if message already exists
        const messageExists = filteredMessages.some(m => m.id === newMessage.id);
        if (messageExists) return prev;
        
        return {
          ...prev,
          messages: [...filteredMessages, {
            id: newMessage.id,
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_id === currentUserId ? "You" : prev.userName,
          }],
        };
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation, currentUserId]);

  /**
   * Handle scroll for glassmorphism effect
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
    const event = new CustomEvent("chatScroll", { detail: isScrolled });
    window.dispatchEvent(event);
  }, [isScrolled]);

  /**
   * Smart scroll - only scroll to bottom if user is already at bottom
   */
  useEffect(() => {
    if (viewMode === "detail" && isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages, viewMode, isAtBottom]);

  /**
   * Track scroll position to determine if user is at bottom
   */
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      // Consider "at bottom" if within 100px of bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  /**
   * Scroll to bottom when conversation changes
   */
  useEffect(() => {
    if (viewMode === "detail" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      setIsAtBottom(true);
    }
  }, [selectedConversation?.id, viewMode]);

  /**
   * Handle conversation click
   */
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setViewMode("detail");
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedConversation(null);
  };

  /**
   * Handle media file selection
   */
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images and GIFs)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedMedia(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Clear media selection
   */
  const handleClearMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Send a message via Supabase (with optimistic update)
   */
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedMedia) || !selectedConversation || !currentUserId) return;

    const messageText = messageInput.trim() || (selectedMedia ? '📷 Photo' : '');
    const tempId = `temp-${Date.now()}`;
    
    // For now, we'll store media as base64 in the message text
    // In production, you'd upload to storage (Supabase Storage, S3, etc.)
    let finalMessageText = messageText;
    if (selectedMedia && mediaPreview) {
      finalMessageText = `${messageText}\n[MEDIA]${mediaPreview}[/MEDIA]`;
    }
    
    // Optimistic update - immediately show the message
    const optimisticMessage: Message = {
      id: tempId,
      text: finalMessageText,
      timestamp: new Date().toISOString(),
      senderId: currentUserId,
      senderName: "You",
    };

    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage],
      };
    });

    setMessageInput("");
    handleClearMedia();
    setIsAtBottom(true);

    try {
      // Send to Supabase - real-time subscription will handle the confirmed message
      await sendMessage(selectedConversation.id, currentUserId, finalMessageText);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove optimistic message on error
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempId),
        };
      });
      
      alert("Failed to send message. Please try again.");
      setMessageInput(messageText);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (hours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div className="chat-container" ref={containerRef}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  // Detail View - Chat Messages
  if (viewMode === "detail" && selectedConversation) {
    return (
      <div className="chat-container" ref={containerRef}>
        <div className="chat-detail-page">
          {/* Chat header */}
          <div className="chat-detail-header">
            <button className="back-button" onClick={handleBackToList}>
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
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <Image
              src={selectedConversation.userAvatar}
              alt={selectedConversation.userName}
              className="chat-detail-avatar"
              width={40}
              height={40}
            />
            <div className="chat-detail-info">
              <h3>{selectedConversation.userName}</h3>
              <span className="chat-status">Online</span>
            </div>
            
            {/* Pay button */}
            <button 
              className="chat-pay-btn"
              onClick={() => setIsPaymentModalOpen(true)}
              aria-label="Send Payment"
            >
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
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              Pay
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" ref={messagesContainerRef}>
            {selectedConversation.messages.map((message) => {
              // Parse media from message text
              const mediaMatch = message.text.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
              const mediaUrl = mediaMatch ? mediaMatch[1] : null;
              const textWithoutMedia = message.text.replace(/\[MEDIA\][\s\S]*?\[\/MEDIA\]/, '').trim();

              return (
                <div
                  key={message.id}
                  className={`message ${
                    message.senderId === currentUserId ? "message-sent" : "message-received"
                  }`}
                >
                  <div className="message-bubble">
                    {mediaUrl && (
                      <div className="message-media">
                        <img src={mediaUrl} alt="Shared media" />
                      </div>
                    )}
                    {textWithoutMedia && <p>{textWithoutMedia}</p>}
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="chat-input-container">
            {/* Media Preview */}
            {mediaPreview && (
              <div className="media-preview-container">
                <div className="media-preview">
                  <img src={mediaPreview} alt="Preview" />
                  <button 
                    className="media-preview-close"
                    onClick={handleClearMedia}
                    aria-label="Remove media"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="chat-input-wrapper">
              {/* Media button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleMediaSelect}
                style={{ display: 'none' }}
              />
              <button
                className="media-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach media"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>

              {/* Text input */}
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="chat-input"
              />

              {/* Send button */}
              <button
                className="send-message-btn"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() && !selectedMedia}
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
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

          {/* Payment Modal */}
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            recipientName={selectedConversation.userName}
            recipientImage={selectedConversation.userAvatar}
            recipientAddress={selectedConversation.userWalletAddress}
            conversationId={selectedConversation.id}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    );
  }

  // List View - All Conversations
  return (
    <div className="chat-container" ref={containerRef}>
      <div className="chat-header">
        <h2>Chats</h2>
        <p className="chat-subtitle">Your conversations</p>
      </div>

      {/* Empty state */}
      {conversations.length === 0 ? (
        <div className="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>No conversations yet</h3>
          <p>Wave to someone on the map to start chatting</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${conversation.unread ? "unread" : ""}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <Image
                src={conversation.userAvatar}
                alt={conversation.userName}
                className="conversation-avatar"
                width={48}
                height={48}
              />
              <div className="conversation-content">
                <div className="conversation-header">
                  <h4 className="conversation-name">{conversation.userName}</h4>
                  <span className="conversation-time">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="conversation-last-message">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unread && <div className="unread-indicator"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat;
