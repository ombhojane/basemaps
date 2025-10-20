"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Map component with Carto Voyager tiles and Base blue theme
 * Clean, minimal design inspired by Uber/Ola maps
 */
const Map = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

      // Sample based people locations (will be replaced with real data)
      const sampleUsers = [
        { lat: 37.7749, lng: -122.4194, pfp: "/pfp/pfp1.jpg", name: "Alice" },
        { lat: 37.7849, lng: -122.4094, pfp: "/pfp/pfp2.jpg", name: "Bob" },
        { lat: 37.7649, lng: -122.4294, pfp: "/pfp/pfp3.jpg", name: "Charlie" },
        { lat: 37.7949, lng: -122.4394, pfp: "/pfp/pfp4.jpg", name: "Diana" },
      ];

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 14);

            // Add current user marker with Base icon
            const currentUserIcon = createAvatarMarker(
              "/icon.png",
              "You",
              true
            );

            L.marker([latitude, longitude], { icon: currentUserIcon })
              .addTo(map)
              .bindPopup(
                `
                <div style="font-family: Inter, sans-serif; padding: 4px;">
                  <strong style="color: #0052FF; font-size: 14px;">You are here!</strong>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
                    Explore based people around you
                  </p>
                </div>
              `,
                {
                  className: "custom-popup",
                }
              );

            // Add sample user markers around current location
            sampleUsers.forEach((user, index) => {
              const userIcon = createAvatarMarker(user.pfp, user.name);
              
              // Offset from current location
              const offsetLat = latitude + (Math.random() - 0.5) * 0.02;
              const offsetLng = longitude + (Math.random() - 0.5) * 0.02;

              L.marker([offsetLat, offsetLng], { icon: userIcon })
                .addTo(map)
                .bindPopup(
                  `
                  <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 180px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                      <img 
                        src="${user.pfp}" 
                        alt="${user.name}"
                        style="
                          width: 48px;
                          height: 48px;
                          border-radius: 8px;
                          border: 2px solid #0052FF;
                          object-fit: cover;
                        "
                      />
                      <div>
                        <strong style="color: #0052FF; font-size: 14px; display: block;">${user.name}</strong>
                        <span style="font-size: 11px; color: #666;">Building onchain</span>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                      <button style="
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
                      <button style="
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
            });
          },
          (error) => {
            console.log("Location access denied, using default location", error);
            
            // Add sample markers at default location
            sampleUsers.forEach((user) => {
              const userIcon = createAvatarMarker(user.pfp, user.name);
              L.marker([user.lat, user.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup(
                  `
                  <div style="font-family: Inter, sans-serif; padding: 4px;">
                    <strong style="color: #0052FF;">${user.name}</strong>
                  </div>
                `,
                  {
                    className: "custom-popup",
                  }
                );
            });
          }
        );
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
  );
};

export default Map;

