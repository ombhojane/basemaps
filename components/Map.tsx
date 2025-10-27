"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PaymentModal from "./PaymentModal";
import {
  getUserByWallet,
  upsertUser,
  getOrCreateConversation,
  sendMessage,
  updateUserLocation,
  getUsersWithLocations,
  getUserAvatar,
} from "@/lib/supabase-helpers";

// Available avatar options
const AVATAR_OPTIONS = [
  "/pfp/pfp1.jpg",
  "/pfp/pfp2.jpg",
  "/pfp/pfp3.jpg",
  "/pfp/pfp4.jpg",
  "/icon.png",
];

/**
 * Map component with Carto Voyager tiles and Base blue theme
 * Clean, minimal design inspired by Uber/Ola maps
 */
const Map = () => {
  const { address } = useAccount();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const addressRef = useRef(address);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    recipientName: "",
    recipientImage: "",
  });

  // Keep addressRef in sync with address
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  /**
   * Initialize current user in Supabase and save location
   */
  useEffect(() => {
    if (!address) return;

    const initUser = async () => {
      try {
        let user = await getUserByWallet(address);
        if (!user) {
          // Assign random avatar to new users
          const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
          user = await upsertUser(address, { avatar: randomAvatar });
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initUser();
  }, [address]);

  /**
   * Handle wave action - creates a new chat conversation via Supabase
   */
  const handleWave = async (userName: string, userAvatar: string, walletAddress: string) => {
    const currentAddress = addressRef.current;
    
    if (!currentAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      // Get or create current user (don't rely on state)
      let currentUser = await getUserByWallet(currentAddress);
      if (!currentUser) {
        const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
        currentUser = await upsertUser(currentAddress, { avatar: randomAvatar });
      }

      // Get or create the other user
      let otherUser = await getUserByWallet(walletAddress);
      if (!otherUser) {
        otherUser = await upsertUser(walletAddress, {
          basename: userName,
          avatar: userAvatar,
        });
      }

      // Get or create conversation
      const conversation = await getOrCreateConversation(currentUser.id, otherUser.id);

      // Send wave message
      await sendMessage(conversation.id, currentUser.id, "👋 Waved at you!");

      alert(`You waved at ${userName}! Check your Chats tab.`);
    } catch (error) {
      console.error("Error waving:", error);
      alert("Failed to send wave. Please try again.");
    }
  };

  /**
   * Creates a custom avatar marker with Base blue styling
   */
  const createAvatarMarker = (
    imagePath: string,
    name: string,
    isCurrentUser = false
  ) => {
    const size = isCurrentUser ? 56 : 48;
    const borderWidth = isCurrentUser ? 4 : 3;
    
    const iconHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border: ${borderWidth}px solid #0052FF;
        border-radius: 12px;
        overflow: hidden;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 82, 255, 0.25);
        cursor: pointer;
        transition: all 0.2s ease;
      " class="avatar-marker" data-name="${name}">
        <img 
          src="${imagePath}" 
          alt="${name}"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
        />
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "custom-avatar-icon",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map with clean settings
      const map = L.map(mapRef.current, {
        center: [37.7749, -122.4194],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      // Add Carto Voyager tile layer (clean, Uber-like style)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20,
          minZoom: 2,
        }
      ).addTo(map);

      // Add custom zoom control (bottom right, Base blue styled)
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      mapInstanceRef.current = map;

      // Function to load and display users from database
      const loadUsersOnMap = async (currentUserAddress?: string) => {
        try {
          const dbUsers = await getUsersWithLocations();
          
          console.log(`Loading ${dbUsers.length} users on map`);
          
          dbUsers.forEach((user) => {
            // Check if this is the current user
            const isCurrentUser = currentUserAddress ? user.wallet_address === currentUserAddress : false;

            const userName = isCurrentUser ? "You" : (user.basename || `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`);
            const userAvatar = getUserAvatar(user);
            console.log(`Creating marker for ${userName} with avatar:`, userAvatar);
            const userIcon = createAvatarMarker(userAvatar, userName, isCurrentUser);

            const marker = L.marker([user.latitude!, user.longitude!], { icon: userIcon })
              .addTo(map)
              .bindPopup(
                `
                <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 180px;">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <img 
                      src="${userAvatar}" 
                      alt="${userName}"
                      style="
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        border: 2px solid #0052FF;
                        object-fit: cover;
                      "
                    />
                    <div>
                      <strong style="color: #0052FF; font-size: 14px; display: block;">${userName}</strong>
                      <span style="font-size: 11px; color: #666;">Building onchain</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="wave-btn" data-wallet="${user.wallet_address}" style="
                      flex: 1;
                      padding: 8px 12px;
                      background: #0052FF;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      font-size: 12px;
                      font-weight: 600;
                      cursor: pointer;
                      font-family: Inter, sans-serif;
                    ">Wave 👋</button>
                    <button class="send-payment-btn" data-wallet="${user.wallet_address}" style="
                      flex: 1;
                      padding: 8px 12px;
                      background: white;
                      color: #0052FF;
                      border: 2px solid #0052FF;
                      border-radius: 8px;
                      font-size: 12px;
                      font-weight: 600;
                      cursor: pointer;
                      font-family: Inter, sans-serif;
                    ">Send $</button>
                  </div>
                </div>
              `,
                {
                  className: "custom-popup",
                }
              );

            // Add event listeners for Wave and Send $ buttons
            marker.on("popupopen", () => {
              setTimeout(() => {
                // Handle Wave button
                const waveBtn = document.querySelector(
                  `.wave-btn[data-wallet="${user.wallet_address}"]`
                ) as HTMLElement;
                if (waveBtn) {
                  waveBtn.onclick = () => {
                    handleWave(userName, userAvatar, user.wallet_address);
                    marker.closePopup();
                  };
                }

                // Handle Send $ button
                const sendBtn = document.querySelector(
                  `.send-payment-btn[data-wallet="${user.wallet_address}"]`
                ) as HTMLElement;
                if (sendBtn) {
                  sendBtn.onclick = () => {
                    setPaymentModal({
                      isOpen: true,
                      recipientName: userName,
                      recipientImage: userAvatar,
                    });
                    marker.closePopup();
                  };
                }
              }, 0);
            });
          });
        } catch (error) {
          console.error("Error loading users on map:", error);
        }
      };

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 14);

            // Save user location to database if wallet is connected
            const currentAddress = addressRef.current;
            if (currentAddress) {
              try {
                await updateUserLocation(currentAddress, latitude, longitude);
                console.log("Location saved to database");
              } catch (error) {
                console.error("Error saving location:", error);
              }
            }

            // Load and display ALL users on map (including current user)
            await loadUsersOnMap(currentAddress);
          },
          async (error) => {
            console.log("Location access denied, using default location", error);
            
            // Load and display database users on map even without location access
            const currentAddress = addressRef.current;
            await loadUsersOnMap(currentAddress);
          }
        );
      } else {
        // No geolocation support, just load database users
        const currentAddress = addressRef.current;
        loadUsersOnMap(currentAddress);
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() =>
          setPaymentModal({ isOpen: false, recipientName: "", recipientImage: "" })
        }
        recipientName={paymentModal.recipientName}
        recipientImage={paymentModal.recipientImage}
      />
    </>
  );
};

export default Map;

