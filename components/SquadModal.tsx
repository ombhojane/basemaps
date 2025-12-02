"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { SquadWithMembers, SquadMember } from "@/lib/supabase";
import {
  getSquadWithMembers,
  joinSquad,
  leaveSquad,
  getUserAvatar,
  getUserDisplayName,
} from "@/lib/supabase-helpers";

interface SquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadId: string | null;
  currentUserId: string | null;
  onMembershipChange?: () => void;
}

const SquadModal = ({
  isOpen,
  onClose,
  squadId,
  currentUserId,
  onMembershipChange,
}: SquadModalProps) => {
  const [squad, setSquad] = useState<SquadWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const loadSquad = useCallback(async () => {
    if (!squadId) return;
    
    setLoading(true);
    try {
      const data = await getSquadWithMembers(squadId);
      setSquad(data);
      
      if (currentUserId && data?.members) {
        const memberIds = data.members.map(m => m.user_id);
        setIsMember(memberIds.includes(currentUserId));
      }
    } catch (error) {
      console.error("Error loading squad:", error);
    } finally {
      setLoading(false);
    }
  }, [squadId, currentUserId]);

  useEffect(() => {
    if (isOpen && squadId) {
      loadSquad();
    }
  }, [isOpen, squadId, loadSquad]);

  const handleJoinLeave = async () => {
    if (!squadId || !currentUserId) return;
    
    setJoining(true);
    try {
      if (isMember) {
        await leaveSquad(squadId, currentUserId);
        setIsMember(false);
      } else {
        await joinSquad(squadId, currentUserId);
        setIsMember(true);
      }
      
      await loadSquad();
      onMembershipChange?.();
    } catch (error) {
      console.error("Error updating membership:", error);
    } finally {
      setJoining(false);
    }
  };

  const getMemberRole = (member: SquadMember): string => {
    switch (member.role) {
      case 'lead':
        return '👑 Lead';
      case 'co-lead':
        return '⭐ Co-Lead';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content squad-modal" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading squad...</p>
          </div>
        ) : squad ? (
          <>
            <div className="modal-header">
              <div className="squad-modal-title">
                <h3>{squad.name}</h3>
              </div>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            <div className="squad-modal-location">
              {squad.city}{squad.region ? `, ${squad.region}` : ''}, {squad.country || 'India'}
            </div>

            {squad.description && (
              <p className="squad-modal-description">{squad.description}</p>
            )}

            <div className="squad-modal-stats">
              <div className="squad-modal-stat">
                <span className="stat-number">{squad.member_count || 0}</span>
                <span className="stat-label">Members</span>
              </div>
            </div>

            <div className="squad-modal-section">
              <h4>Members</h4>
              {squad.members && squad.members.length > 0 ? (
                <div className="squad-members-list">
                  {squad.members.map((member) => (
                    <div key={member.id} className="squad-member-item">
                      <Image
                        src={member.user ? getUserAvatar(member.user) : '/icon.png'}
                        alt={member.user ? getUserDisplayName(member.user) : 'Member'}
                        width={44}
                        height={44}
                        className="squad-member-avatar-large"
                        unoptimized
                      />
                      <div className="squad-member-info">
                        <span className="squad-member-name">
                          {member.user ? getUserDisplayName(member.user) : 'Anonymous'}
                        </span>
                        {member.role !== 'member' && (
                          <span className="squad-member-role">
                            {getMemberRole(member)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="squad-no-members">No members yet. Be the first to join!</p>
              )}
            </div>

            <div className="squad-modal-actions">
              {currentUserId ? (
                <button
                  className={`squad-modal-btn ${isMember ? 'leave' : 'join'}`}
                  onClick={handleJoinLeave}
                  disabled={joining}
                >
                  {joining ? (
                    <span className="btn-spinner"></span>
                  ) : isMember ? (
                    'Leave Squad'
                  ) : (
                    'Join Squad'
                  )}
                </button>
              ) : (
                <p className="squad-connect-prompt">Connect wallet to join this squad</p>
              )}
            </div>

            {(squad.telegram_link || squad.twitter_handle) && (
              <div className="squad-modal-links">
                {squad.telegram_link && (
                  <a
                    href={squad.telegram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="squad-modal-link telegram"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Join Telegram
                  </a>
                )}
                {squad.twitter_handle && (
                  <a
                    href={`https://x.com/${squad.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="squad-modal-link twitter"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Follow on X
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="squad-not-found">
            <p>Squad not found</p>
            <button className="modal-close-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadModal;
