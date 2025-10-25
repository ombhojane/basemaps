"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  senderId: string;
  senderName: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: number;
  unread: boolean;
  messages: Message[];
}

/**
 * Chat page component
 * Shows conversations and allows messaging with users
 */
const Chat = () => {
  const { address } = useAccount();
  const currentUserId = address || "current-user";
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Load conversations from localStorage
   */
  useEffect(() => {
    const loadConversations = () => {
      const stored = localStorage.getItem("conversations");
      if (stored) {
        const loadedConversations = JSON.parse(stored);
        setConversations(loadedConversations);
      }
    };

    loadConversations();

    // Listen for storage changes (when new waves/messages are added)
    window.addEventListener("storage", loadConversations);
    
    // Refresh every 2 seconds when on chat page
    const interval = setInterval(loadConversations, 2000);

    return () => {
      window.removeEventListener("storage", loadConversations);
      clearInterval(interval);
    };
  }, []);

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
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    if (viewMode === "detail" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages, viewMode]);

  /**
   * Handle conversation click
   */
  const handleConversationClick = (conversation: Conversation) => {
    // Mark as read
    const updatedConversations = conversations.map((conv) =>
      conv.id === conversation.id ? { ...conv, unread: false } : conv
    );
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));

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
   * Send a message
   */
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageInput,
      timestamp: Date.now(),
      senderId: currentUserId,
      senderName: "You",
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: Date.now(),
    };

    const updatedConversations = conversations.map((conv) =>
      conv.id === selectedConversation.id ? updatedConversation : conv
    );

    // Sort conversations by last message time
    updatedConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    setConversations(updatedConversations);
    setSelectedConversation(updatedConversation);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
    
    // Trigger storage event
    window.dispatchEvent(new Event("storage"));
    
    setMessageInput("");
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
  const formatTime = (timestamp: number) => {
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
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.senderId === currentUserId ? "message-sent" : "message-received"
                }`}
              >
                <div className="message-bubble">
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="chat-input"
            />
            <button
              className="send-message-btn"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
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

