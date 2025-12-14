"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import PaymentModal from "./PaymentModal";
import OnboardingModal from "./OnboardingModal";
import RegionSelector from "./RegionSelector";
import {
  getUserByWallet,
  upsertUser,
  getOrCreateConversation,
  sendMessage,
  updateUserLocation,
  getUsersWithLocations,
  getUserAvatar,
  getUserDisplayName,
  getSquadsWithMemberCount,
} from "@/lib/supabase-helpers";
import type { User, SquadWithMembers } from "@/lib/supabase";
import { createSquadMarkerIcon } from "./SquadMarker";
import SquadModal from "./SquadModal";

// Zoom thresholds for layer visibility
const ZOOM_THRESHOLD_MARKERS = 11;  // Show user markers at this zoom and above

// Blue-white gradient for heatmap (Base brand colors)
const HEATMAP_GRADIENT: { [key: number]: string } = {
  0.0: 'rgba(255, 255, 255, 0)',      // Transparent white
  0.2: 'rgba(230, 240, 255, 0.6)',    // Very light blue
  0.4: 'rgba(179, 209, 255, 0.7)',    // Light blue
  0.6: 'rgba(128, 172, 255, 0.8)',    // Medium blue
  0.8: 'rgba(77, 139, 255, 0.9)',     // Bright blue
  1.0: 'rgba(0, 82, 255, 1)',         // Base blue (#0052FF)
};

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
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const squadLayerRef = useRef<L.LayerGroup | null>(null);
  const usersDataRef = useRef<User[]>([]);
  const squadsDataRef = useRef<SquadWithMembers[]>([]);
  const addressRef = useRef(address);
  const currentUserIdRef = useRef<string | null>(null);
  
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    recipientName: "",
    recipientImage: "",
    recipientAddress: "",
  });
  const [onboardingModal, setOnboardingModal] = useState({
    isOpen: false,
    hasBasename: true,
    locationDenied: false,
  });
  const [squadModal, setSquadModal] = useState({
    isOpen: false,
    squadId: null as string | null,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showUtilities, setShowUtilities] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('basemaps_heatmap_enabled');
      return saved === 'true';
    }
    return false;
  });

  // Keep addressRef in sync with address
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  /**
   * Handle heatmap toggle - trigger visibility update
   * Persists state to localStorage
   */
  useEffect(() => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('basemaps_heatmap_enabled', String(heatmapEnabled));
    }

    // Trigger map layer update if map is initialized
    if (mapInstanceRef.current) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        mapInstanceRef.current?.fire('zoomend');
      }, 50);
    }
  }, [heatmapEnabled]);

  /**
   * Handle region selection from RegionSelector
   */
  const handleRegionSelect = (lat: number, lng: number, name: string) => {
    if (mapInstanceRef.current) {
      console.log(`Navigating to: ${name} (${lat}, ${lng})`);
      mapInstanceRef.current.setView([lat, lng], 13, {
        animate: true,
        duration: 1,
      });
    }
  };

  /**
   * Initialize current user and check if onboarding needed
   */
  useEffect(() => {
    if (!address) return;

    const initUser = async () => {
      try {
        console.log("=== INITIALIZING USER ===");
        console.log("Wallet address:", address);
        
        let user = await getUserByWallet(address);
        console.log("User data from DB:", user);
        
        if (!user) {
          console.log("New user, creating...");
          // Create new user with random avatar
          const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
          user = await upsertUser(address, { avatar: randomAvatar });
          console.log("User created:", user);
        }

        // Check if onboarding is needed (after map loads)
        setTimeout(() => {
          checkOnboardingNeeded(user);
        }, 2000);
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    const checkOnboardingNeeded = (user: User | null) => {
      console.log("=== CHECKING ONBOARDING STATUS ===");
      console.log("User:", user);
      
      const hasName = !!user?.basename || !!user?.preferred_name;
      const hasLocation = !!user?.latitude && !!user?.longitude;
      
      console.log("Has name (basename or preferred):", hasName);
      console.log("Has location (lat/lng):", hasLocation);
      console.log("Basename:", user?.basename);
      console.log("Preferred name:", user?.preferred_name);
      console.log("Latitude:", user?.latitude);
      console.log("Longitude:", user?.longitude);
      
      if (!hasName || !hasLocation) {
        console.log("⚠️ ONBOARDING NEEDED");
        setOnboardingModal({
          isOpen: true,
          hasBasename: hasName,
          locationDenied: !hasLocation,
        });
      } else {
        console.log("✓ User fully onboarded");
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
      <div style="display: flex; flex-direction: column; align-items: center;">
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
        <div style="
          margin-top: 3px;
          padding: 4px 8px;
          color: white;
          background: #0052ff;
          font-weight: 600;
          font-size: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        ">
          ${name}
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "custom-avatar-icon",
    });
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map with Mumbai as default center
      const map = L.map(mapRef.current, {
        center: [19.0760, 72.8777], // Mumbai, India
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

      // Create marker layer group for users
      const markerLayer = L.layerGroup();
      markerLayerRef.current = markerLayer;

      // Create layer group for squads
      const squadLayer = L.layerGroup();
      squadLayerRef.current = squadLayer;

      /**
       * Creates squad markers and adds them to the squad layer
       * Dynamically scales markers based on zoom level
       */
      const createSquadMarkers = (squads: SquadWithMembers[], zoom: number) => {
        // Clear existing squad markers
        squadLayer.clearLayers();

        squads.forEach((squad) => {
          if (!squad.latitude || !squad.longitude) return;

          const squadIcon = createSquadMarkerIcon(squad, zoom);
          const marker = L.marker([squad.latitude, squad.longitude], { icon: squadIcon });

          // Add click handler to open squad modal
          marker.on('click', () => {
            setSquadModal({
              isOpen: true,
              squadId: squad.id,
            });
          });

          // Add marker to squad layer
          squadLayer.addLayer(marker);
        });

        console.log(`Created ${squads.length} squad markers at zoom ${zoom}`);
      };

      /**
       * Loads squads from database and displays on map
       */
      const loadSquadsOnMap = async () => {
        try {
          const squads = await getSquadsWithMemberCount();
          console.log(`Loading ${squads.length} squads on map`);
          
          // Store squads data
          squadsDataRef.current = squads;

          // Create squad markers with current zoom
          const currentZoom = map.getZoom();
          createSquadMarkers(squads, currentZoom);
        } catch (error) {
          console.error("Error loading squads on map:", error);
        }
      };

      /**
       * Creates heatmap layer from user locations
       */
      const createHeatmapLayer = (users: User[]): L.HeatLayer => {
        const heatData: L.HeatLatLngTuple[] = users
          .filter(u => u.latitude && u.longitude)
          .map(u => [u.latitude!, u.longitude!, 1.0]);

        return L.heatLayer(heatData, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.4,
          gradient: HEATMAP_GRADIENT,
        });
      };

      /**
       * Creates markers and adds them to the marker layer group
       */
      const createMarkers = (users: User[], currentUserAddress?: string) => {
        // Clear existing markers
        markerLayer.clearLayers();

        // Track used positions to prevent overlap
        const usedPositions: { lat: number; lng: number }[] = [];
        const minDistance = 0.002; // Minimum distance between markers (~200 meters)

        users.forEach((user) => {
          if (!user.latitude || !user.longitude) return;

          // Check if this is the current user
          const isCurrentUser = currentUserAddress ? user.wallet_address === currentUserAddress : false;

          const userName = isCurrentUser ? "You" : getUserDisplayName(user);
          const userAvatar = getUserAvatar(user);
          const userIcon = createAvatarMarker(userAvatar, userName, isCurrentUser);

          const xHandle = user.x_handle;
          const farcaster = user.farcaster_username;

          // Check if position is too close to existing markers and adjust
          let lat = user.latitude;
          let lng = user.longitude;
          let attempts = 0;
          let isTooClose = true;

          while (isTooClose && attempts < 20) {
            isTooClose = false;
            for (const pos of usedPositions) {
              const distance = Math.sqrt(Math.pow(lat - pos.lat, 2) + Math.pow(lng - pos.lng, 2));
              if (distance < minDistance) {
                // Add offset in a circular pattern to spread markers evenly
                const angle = (attempts * Math.PI * 2) / 8; // 8 positions around circle
                lat = user.latitude + Math.cos(angle) * minDistance;
                lng = user.longitude + Math.sin(angle) * minDistance;
                isTooClose = true;
                attempts++;
                break;
              }
            }
          }

          // Store this position
          usedPositions.push({ lat, lng });

          const marker = L.marker([lat, lng], { icon: userIcon })
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
                ${(xHandle || farcaster) ? `
                <div style="display: flex; gap: 8px; margin: 6px 0 10px 0;">
                  ${xHandle ? `<a href="https://x.com/${xHandle}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                    <span style="display:inline-block;padding:6px 10px;border-radius:8px;border:2px solid #0052FF;color:#0052FF;background:#fff;font-weight:600;font-size:12px;">X</span>
                  </a>` : ''}
                  ${farcaster ? `<a href="https://warpcast.com/${farcaster}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                    <span style="display:inline-block;padding:6px 10px;border-radius:8px;border:2px solid #0052FF;color:#0052FF;background:#fff;font-weight:600;font-size:12px;">Farcaster</span>
                  </a>` : ''}
                </div>` : ''}
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
                    recipientAddress: user.wallet_address,
                  });
                  marker.closePopup();
                };
              }
            }, 0);
          });

          // Add marker to the layer group
          markerLayer.addLayer(marker);
        });
      };

      /**
       * Updates layer visibility based on current zoom level and heatmap toggle
       * - Squad markers: Always visible with dynamic sizing
       * - When heatmap is ON:
       *   - Zoom < 11: Show heatmap, hide user markers
       *   - Zoom >= 11: Show user markers, hide heatmap
       * - When heatmap is OFF: Always show user markers
       */
      const updateLayerVisibility = () => {
        const currentZoom = map.getZoom();
        const container = mapRef.current;
        const showMarkers = currentZoom >= ZOOM_THRESHOLD_MARKERS;

        // Squad markers are always visible - just update their size based on zoom
        if (squadLayerRef.current && !map.hasLayer(squadLayerRef.current)) {
          squadLayerRef.current.addTo(map);
        }
        
        // Refresh squad markers with new zoom level for dynamic scaling
        if (squadsDataRef.current.length > 0) {
          createSquadMarkers(squadsDataRef.current, currentZoom);
        }

        if (heatmapEnabled) {
          // Heatmap mode: toggle between heatmap and markers based on zoom
          if (showMarkers) {
            // Zoomed in: show markers, hide heatmap
            if (!map.hasLayer(markerLayer)) {
              markerLayer.addTo(map);
            }
            if (container) {
              container.classList.remove('markers-hidden');
              container.classList.add('markers-visible');
            }

            // Fade out and remove heatmap
            if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
              const heatmapCanvas = mapRef.current?.querySelector('canvas') as HTMLCanvasElement;
              if (heatmapCanvas) {
                heatmapCanvas.style.transition = 'opacity 0.3s ease-out';
                heatmapCanvas.style.opacity = '0';
              }
              setTimeout(() => {
                if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
                  heatLayerRef.current.remove();
                }
              }, 300);
            }
          } else {
            // Zoomed out: show heatmap, hide markers
            if (heatLayerRef.current && !map.hasLayer(heatLayerRef.current)) {
              heatLayerRef.current.addTo(map);
              // Fade in effect
              const heatmapCanvas = mapRef.current?.querySelector('canvas') as HTMLCanvasElement;
              if (heatmapCanvas) {
                heatmapCanvas.style.opacity = '0';
                heatmapCanvas.style.transition = 'opacity 0.3s ease-out';
                requestAnimationFrame(() => {
                  heatmapCanvas.style.opacity = '1';
                });
              }
            }

            // Hide markers
            if (container) {
              container.classList.add('markers-hidden');
              container.classList.remove('markers-visible');
            }
            setTimeout(() => {
              if (map.hasLayer(markerLayer)) {
                markerLayer.remove();
              }
            }, 300);
          }
        } else {
          // Heatmap disabled: always show markers
          if (!map.hasLayer(markerLayer)) {
            markerLayer.addTo(map);
          }
          if (container) {
            container.classList.remove('markers-hidden');
            container.classList.add('markers-visible');
          }

          // Remove heatmap if present
          if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
            heatLayerRef.current.remove();
          }
        }
      };

      // Listen for zoom changes to toggle layers
      map.on('zoomend', updateLayerVisibility);

      // Function to load and display users from database
      const loadUsersOnMap = async (currentUserAddress?: string) => {
        try {
          const dbUsers = await getUsersWithLocations();
          console.log(`Loading ${dbUsers.length} users with locations on map`);
          
          // Store users data for later use
          usersDataRef.current = dbUsers;

          // Create heatmap layer
          if (heatLayerRef.current) {
            heatLayerRef.current.remove();
          }
          const heatLayer = createHeatmapLayer(dbUsers);
          heatLayerRef.current = heatLayer;

          // Create markers
          createMarkers(dbUsers, currentUserAddress);

          // Set initial visibility based on current zoom and heatmap state
          updateLayerVisibility();
        } catch (error) {
          console.error("Error loading users on map:", error);
        }
      };

      // Initialize location and load users
      const initializeLocation = async () => {
        // Wait for address to be available (up to 2 seconds)
        let currentAddress = addressRef.current;
        let attempts = 0;
        
        while (!currentAddress && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          currentAddress = addressRef.current;
          attempts++;
        }
        
        let locationSet = false;
        
        // Check if user has a saved location first
        if (currentAddress) {
          try {
            const user = await getUserByWallet(currentAddress);
            
            if (user && user.latitude && user.longitude) {
              console.log(`✓ Using saved location: ${user.latitude}, ${user.longitude}`);
              locationSet = true;
              
              // Center map on saved location
              map.setView([user.latitude, user.longitude], 14);
              
              // Store current user id for squad membership checks
              currentUserIdRef.current = user.id;
              setCurrentUserId(user.id);
              
              // Load users and squads on map
              await loadUsersOnMap(currentAddress);
              await loadSquadsOnMap();
              return; // Exit early - we're done!
            }
          } catch (err) {
            console.error("Error loading saved location:", err);
          }
        }
        
        // Only try browser geolocation if no saved location
        if (!locationSet && navigator.geolocation) {
          console.log("No saved location, requesting browser location...");
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              console.log(`Browser location: ${latitude}, ${longitude}`);
              
              map.setView([latitude, longitude], 14);

              // Save user location to database if wallet is connected
              if (currentAddress) {
                try {
                  await updateUserLocation(currentAddress, latitude, longitude);
                  const user = await getUserByWallet(currentAddress);
                  if (user) {
                    currentUserIdRef.current = user.id;
                    setCurrentUserId(user.id);
                  }
                } catch (error) {
                  console.error("Error saving location:", error);
                }
              }

              await loadUsersOnMap(currentAddress);
              await loadSquadsOnMap();
            },
            async (_error) => {
              console.log("Location access denied, using default location (Mumbai)");
              map.setView([19.0760, 72.8777], 13);
              await loadUsersOnMap(currentAddress);
              await loadSquadsOnMap();
            }
          );
        } else if (!locationSet) {
          // No geolocation support and no saved location
          console.log("No geolocation support, using default location (Mumbai)");
          map.setView([19.0760, 72.8777], 13);
          await loadUsersOnMap(currentAddress);
          await loadSquadsOnMap();
        }
      };
      
      // Start initialization
      initializeLocation();
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  /**
   * Re-center map when address changes and user has a saved location
   * This ensures map redirects to user's location after onboarding
   */
  useEffect(() => {
    if (!address || !mapInstanceRef.current) return;

    const checkAndRecenterMap = async () => {
      try {
        const user = await getUserByWallet(address);
        
        if (user && user.latitude && user.longitude && mapInstanceRef.current) {
          console.log(`🎯 Re-centering map to saved location: ${user.latitude}, ${user.longitude}`);
          mapInstanceRef.current.setView([user.latitude, user.longitude], 14, {
            animate: true,
            duration: 1
          });
        }
      } catch (err) {
        console.error("Error re-centering map:", err);
      }
    };

    // Delay to allow DB to fully update after onboarding
    const timeoutId = setTimeout(checkAndRecenterMap, 500);
    
    return () => clearTimeout(timeoutId);
  }, [address]);

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
      
      <RegionSelector onRegionSelect={handleRegionSelect} />
      
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() =>
          setPaymentModal({ isOpen: false, recipientName: "", recipientImage: "", recipientAddress: "" })
        }
        recipientName={paymentModal.recipientName}
        recipientImage={paymentModal.recipientImage}
        recipientAddress={paymentModal.recipientAddress}
      />
      
      <OnboardingModal
        isOpen={onboardingModal.isOpen}
        onClose={() => setOnboardingModal({ ...onboardingModal, isOpen: false })}
        walletAddress={address || ""}
        hasBasename={onboardingModal.hasBasename}
        locationDenied={onboardingModal.locationDenied}
      />
      
      <SquadModal
        isOpen={squadModal.isOpen}
        onClose={() => setSquadModal({ isOpen: false, squadId: null })}
        squadId={squadModal.squadId}
        currentUserId={currentUserId}
        onMembershipChange={() => {
          // Refresh squad markers when membership changes
          if (squadsDataRef.current.length > 0 && mapInstanceRef.current) {
            getSquadsWithMemberCount().then(squads => {
              squadsDataRef.current = squads;
              // Re-create squad markers with updated counts and current zoom
              if (squadLayerRef.current && mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom();
                squadLayerRef.current.clearLayers();
                squads.forEach((squad) => {
                  if (!squad.latitude || !squad.longitude) return;
                  const squadIcon = createSquadMarkerIcon(squad, currentZoom);
                  const marker = L.marker([squad.latitude, squad.longitude], { icon: squadIcon });
                  marker.on('click', () => {
                    setSquadModal({ isOpen: true, squadId: squad.id });
                  });
                  squadLayerRef.current?.addLayer(marker);
                });
              }
            });
          }
        }}
      />

      {/* Utilities Button */}
      <div className="utilities-container">
        <button
          className="utilities-btn"
          onClick={() => setShowUtilities(!showUtilities)}
          aria-label="Utilities"
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
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m8.66-13l-3 5.196M9.34 15.804L6.34 21M23 12h-6m-6 0H1m17.66 8.66l-3-5.196M9.34 8.196l-3-5.196"></path>
          </svg>
        </button>

        {/* Utilities Menu Card */}
        {showUtilities && (
          <div className="utilities-menu">
            <div className="utilities-header">
              <h3>Utilities</h3>
              <button
                className="utilities-close"
                onClick={() => setShowUtilities(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="utilities-content">
              <div className="utility-item">
                <div className="utility-info">
                  <span className="utility-label">Heatmap</span>
                  <span className="utility-description">Show density visualization</span>
                </div>
                <button
                  className={`toggle-switch ${heatmapEnabled ? 'active' : ''}`}
                  onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                  aria-label="Toggle heatmap"
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Map;

