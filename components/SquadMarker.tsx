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
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow-${squad.id}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="baseGradient-${squad.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#0052FF"/>
                <stop offset="100%" style="stop-color:#0041CC"/>
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#baseGradient-${squad.id})" filter="url(#glow-${squad.id})"/>
            <circle cx="24" cy="24" r="22" stroke="white" stroke-width="2" fill="none"/>
            <path d="M16 14h10c3.5 0 6 2.5 6 6 0 2-1 3.5-2.5 4.5 2 1 3.5 3 3.5 5.5 0 4-3 6-7 6H16V14zm4 8h5c1.5 0 2.5-1 2.5-2.5S26.5 17 25 17h-5v5zm0 10h6c2 0 3-1.2 3-3s-1-3-3-3h-6v6z" fill="white"/>
          </svg>
          ${memberCount > 0 ? `
            <div class="squad-member-badge">
              ${memberCount > 99 ? '99+' : memberCount}
            </div>
          ` : ''}
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
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="#0052FF"/>
            <circle cx="24" cy="24" r="22" stroke="white" stroke-width="2" fill="none"/>
            <path d="M16 14h10c3.5 0 6 2.5 6 6 0 2-1 3.5-2.5 4.5 2 1 3.5 3 3.5 5.5 0 4-3 6-7 6H16V14zm4 8h5c1.5 0 2.5-1 2.5-2.5S26.5 17 25 17h-5v5zm0 10h6c2 0 3-1.2 3-3s-1-3-3-3h-6v6z" fill="white"/>
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

