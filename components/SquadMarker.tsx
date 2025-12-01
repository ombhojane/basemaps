"use client";

import L from "leaflet";
import type { SquadWithMembers } from "@/lib/supabase";

/**
 * Creates a custom squad marker icon with Base brand styling
 * Features:
 * - Blue Base icon with gradient
 * - Member count badge
 * - Squad name label
 * - Glow effect for visibility
 */
export function createSquadMarkerIcon(squad: SquadWithMembers): L.DivIcon {
  const memberCount = squad.member_count || 0;
  
  const iconHtml = `
    <div class="squad-marker-container">
      <div class="squad-marker">
        <div class="squad-icon-wrapper">
          <svg width="48" height="48" viewBox="0 0 249 249" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 19.671C0 12.9332 0 9.56425 1.26956 6.97276C2.48511 4.49151 4.49151 2.48511 6.97276 1.26956C9.56425 0 12.9332 0 19.671 0H229.329C236.067 0 239.436 0 242.027 1.26956C244.508 2.48511 246.515 4.49151 247.73 6.97276C249 9.56425 249 12.9332 249 19.671V229.329C249 236.067 249 239.436 247.73 242.027C246.515 244.508 244.508 246.515 242.027 247.73C239.436 249 236.067 249 229.329 249H19.671C12.9332 249 9.56425 249 6.97276 247.73C4.49151 246.515 2.48511 244.508 1.26956 242.027C0 239.436 0 236.067 0 229.329V19.671Z" fill="#0000FF"/>
          </svg>
        </div>
        <div class="squad-name-label">
          ${squad.name}
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "squad-marker-icon",
    iconSize: [60, 80],
    iconAnchor: [30, 70],
    popupAnchor: [0, -60],
  });
}

/**
 * Creates HTML content for squad popup
 */
export function createSquadPopupContent(
  squad: SquadWithMembers,
  isCurrentUserMember: boolean,
  onJoin: () => void,
  onLeave: () => void,
  onViewDetails: () => void
): string {
  const memberCount = squad.member_count || 0;
  const topMembers = squad.members?.slice(0, 3) || [];

  return `
    <div class="squad-popup">
      <div class="squad-popup-header">
        <div class="squad-popup-icon">
          <svg width="40" height="40" viewBox="0 0 249 249" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 19.671C0 12.9332 0 9.56425 1.26956 6.97276C2.48511 4.49151 4.49151 2.48511 6.97276 1.26956C9.56425 0 12.9332 0 19.671 0H229.329C236.067 0 239.436 0 242.027 1.26956C244.508 2.48511 246.515 4.49151 247.73 6.97276C249 9.56425 249 12.9332 249 19.671V229.329C249 236.067 249 239.436 247.73 242.027C246.515 244.508 244.508 246.515 242.027 247.73C239.436 249 236.067 249 229.329 249H19.671C12.9332 249 9.56425 249 6.97276 247.73C4.49151 246.515 2.48511 244.508 1.26956 242.027C0 239.436 0 236.067 0 229.329V19.671Z" fill="#0000FF"/>
          </svg>
        </div>
        <div class="squad-popup-info">
          <h3 class="squad-popup-name">${squad.name}</h3>
          <p class="squad-popup-location">📍 ${squad.city}${squad.region ? `, ${squad.region}` : ''}</p>
        </div>
      </div>
      
      ${squad.description ? `
        <p class="squad-popup-description">${squad.description}</p>
      ` : ''}
      
      <div class="squad-popup-stats">
        <div class="squad-stat">
          <span class="squad-stat-value">${memberCount}</span>
          <span class="squad-stat-label">members</span>
        </div>
      </div>
      
      ${topMembers.length > 0 ? `
        <div class="squad-popup-members">
          <div class="squad-members-avatars">
            ${topMembers.map(m => `
              <img 
                src="${m.user?.farcaster_pfp || m.user?.avatar || '/icon.png'}" 
                alt="${m.user?.preferred_name || m.user?.basename || 'Member'}"
                class="squad-member-avatar"
              />
            `).join('')}
            ${memberCount > 3 ? `
              <div class="squad-members-more">+${memberCount - 3}</div>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="squad-popup-actions">
        <button class="squad-action-btn ${isCurrentUserMember ? 'joined' : 'join'}" data-action="${isCurrentUserMember ? 'leave' : 'join'}" data-squad-id="${squad.id}">
          ${isCurrentUserMember ? '✓ Joined' : 'Join Squad'}
        </button>
        <button class="squad-action-btn details" data-action="details" data-squad-id="${squad.id}">
          View Details
        </button>
      </div>
      
      ${squad.telegram_link || squad.twitter_handle ? `
        <div class="squad-popup-links">
          ${squad.telegram_link ? `
            <a href="${squad.telegram_link}" target="_blank" rel="noopener noreferrer" class="squad-link telegram">
              Telegram
            </a>
          ` : ''}
          ${squad.twitter_handle ? `
            <a href="https://x.com/${squad.twitter_handle}" target="_blank" rel="noopener noreferrer" class="squad-link twitter">
              X / Twitter
            </a>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

