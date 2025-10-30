"use client";

import { useState, useRef, useEffect } from "react";

interface Region {
  name: string;
  lat: number;
  lng: number;
}

const PRESET_REGIONS: Region[] = [
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "New Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

interface RegionSelectorProps {
  onRegionSelect: (lat: number, lng: number, name: string) => void;
}

const RegionSelector = ({ onRegionSelect }: RegionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for locations using Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await response.json();

      const results: Region[] = data.map((item: { display_name: string; lat: string; lon: string }) => ({
        name: item.display_name.split(",").slice(0, 2).join(","),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleRegionClick = (region: Region) => {
    onRegionSelect(region.lat, region.lng, region.name);
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const filteredPresets = PRESET_REGIONS.filter((region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showPresets = !searchQuery || filteredPresets.length > 0;
  const showSearchResults = searchQuery && searchResults.length > 0;

  return (
    <div className="region-selector" ref={dropdownRef}>
      <button
        className="region-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select region"
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
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="region-dropdown">
          <div className="region-search-wrapper">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="region-search-input"
              autoFocus
            />
            {isSearching && (
              <div className="search-spinner-mini"></div>
            )}
          </div>

          {/* Preset Regions */}
          {showPresets && !searchQuery && (
            <div className="region-section">
              <div className="region-section-title">Quick Access</div>
              {PRESET_REGIONS.map((region) => (
                <button
                  key={region.name}
                  className="region-item"
                  onClick={() => handleRegionClick(region)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{region.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Filtered Presets when searching */}
          {showPresets && searchQuery && filteredPresets.length > 0 && (
            <div className="region-section">
              <div className="region-section-title">Quick Access</div>
              {filteredPresets.map((region) => (
                <button
                  key={region.name}
                  className="region-item"
                  onClick={() => handleRegionClick(region)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{region.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {showSearchResults && (
            <div className="region-section">
              <div className="region-section-title">Search Results</div>
              {searchResults.map((region, index) => (
                <button
                  key={index}
                  className="region-item"
                  onClick={() => handleRegionClick(region)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{region.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && !isSearching && !showSearchResults && filteredPresets.length === 0 && (
            <div className="region-no-results">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <p>No locations found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
