"use client";

import { useState, useEffect } from "react";
import { upsertUser, updateUserLocation } from "@/lib/supabase-helpers";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  hasBasename: boolean;
  locationDenied: boolean;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const OnboardingModal = ({
  isOpen,
  onClose,
  walletAddress,
  hasBasename,
  locationDenied,
}: OnboardingModalProps) => {
  const [preferredName, setPreferredName] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch location suggestions from Nominatim API
  useEffect(() => {
    if (locationSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationSearch
        )}&limit=5`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  const handleSave = async () => {
    // Validation
    if (!hasBasename && !preferredName.trim()) {
      alert("Please enter your preferred name");
      return;
    }

    if (locationDenied && !selectedLocation) {
      alert("Please select your location from the dropdown");
      return;
    }

    setIsSaving(true);
    try {
      // Update user with preferred name if needed
      if (!hasBasename && preferredName.trim()) {
        await upsertUser(walletAddress, { preferred_name: preferredName.trim() });
      }

      // Update location if selected
      if (locationDenied && selectedLocation) {
        const lat = parseFloat(selectedLocation.lat);
        const lon = parseFloat(selectedLocation.lon);
        await updateUserLocation(walletAddress, lat, lon);
      }

      onClose();
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location);
    setLocationSearch(location.display_name);
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSaving) {
      e.preventDefault();
      
      // If there are suggestions visible and one is selected, use that
      if (suggestions.length > 0 && !selectedLocation) {
        handleLocationSelect(suggestions[0]);
        return;
      }
      
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content onboarding-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Welcome to Basemaps! 👋</h3>
        </div>

        <p className="onboarding-subtitle">
          Lets set up your profile to get started
        </p>

        {/* Preferred Name Input */}
        {!hasBasename && (
          <div className="onboarding-section">
            <label className="onboarding-label">
              What should we call you? <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="onboarding-input"
              maxLength={50}
            />
            <p className="input-hint">This will be your display name on the map</p>
          </div>
        )}

        {/* Location Search */}
        {locationDenied && (
          <div className="onboarding-section">
            <label className="onboarding-label">
              Where are you located? <span className="required">*</span>
            </label>
            <div className="location-search-wrapper">
              <input
                type="text"
                placeholder="Type your city (e.g., Mumbai, London)"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="onboarding-input"
              />
              {isSearching && (
                <div className="search-spinner">
                  <div className="loading-spinner-small"></div>
                </div>
              )}
            </div>

            {/* Location Suggestions */}
            {!isSearching && locationSearch.length >= 2 && suggestions.length === 0 && (
              <div className="location-no-results">
                No locations found. Try a different search.
              </div>
            )}
            
            {suggestions.length > 0 && (
              <div className="location-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="location-suggestion-item"
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {suggestion.display_name}
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <div className="selected-location">
                ✓ Selected: <strong>{selectedLocation.display_name}</strong>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="onboarding-actions">
          <button
            className="onboarding-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;

