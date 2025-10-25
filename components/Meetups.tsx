"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

interface Attendee {
  id: string;
  name: string;
  avatar: string;
  isMutual?: boolean;
}

interface Meetup {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverImage: string;
  attendees: Attendee[];
  capacity: number;
  isPast: boolean;
}

/**
 * Meetups page component
 * Shows past and upcoming Base community meetups with Luma-style cards
 */
const Meetups = () => {
  const { address } = useAccount();
  const currentUserId = address || "current-user";
  const containerRef = useRef<HTMLDivElement>(null);

  const [meetups, setMeetups] = useState<Meetup[]>([
    {
      id: "1",
      title: "Base Around the World",
      description: "Join us for a global gathering of Base community members to share experiences, insights, and build connections across continents. This virtual event brings together builders, creators, and enthusiasts from every corner of the globe.",
      date: "November 15, 2025",
      time: "3:00 PM UTC",
      location: "Virtual Event",
      coverImage: "/hero.png",
      capacity: 500,
      isPast: false,
      attendees: [
        { id: "alice", name: "Alice", avatar: "/pfp/pfp1.jpg", isMutual: true },
        { id: "bob", name: "Bob", avatar: "/pfp/pfp2.jpg", isMutual: false },
        { id: "charlie", name: "Charlie", avatar: "/pfp/pfp3.jpg", isMutual: false },
        { id: "diana", name: "Diana", avatar: "/pfp/pfp4.jpg", isMutual: false },
      ],
    },
    {
      id: "2",
      title: "Base Onchain Hackathon Dinner",
      description: "Celebrate the conclusion of our onchain hackathon with an exclusive dinner featuring project showcases, networking opportunities, and insights from Base ecosystem leaders. Meet fellow builders and share your journey.",
      date: "December 5, 2025",
      time: "7:00 PM PST",
      location: "123 Blockchain Ave, San Francisco, CA",
      coverImage: "/screenshot.png",
      capacity: 100,
      isPast: false,
      attendees: [
        { id: "alice", name: "Alice", avatar: "/pfp/pfp1.jpg", isMutual: true },
        { id: "eve", name: "Eve", avatar: "/pfp/pfp2.jpg", isMutual: false },
        { id: "frank", name: "Frank", avatar: "/pfp/pfp3.jpg", isMutual: false },
      ],
    },
    {
      id: "3",
      title: "Base Builder Meetup - NYC",
      description: "Connect with the Base community in New York City! An evening of demos, discussions, and networking with local builders pushing the boundaries of onchain innovation. Food and drinks provided.",
      date: "October 10, 2025",
      time: "6:00 PM EST",
      location: "Base HQ, New York, NY",
      coverImage: "/hero.png",
      capacity: 75,
      isPast: true,
      attendees: [
        { id: "alice", name: "Alice", avatar: "/pfp/pfp1.jpg", isMutual: true },
        { id: "grace", name: "Grace", avatar: "/pfp/pfp4.jpg", isMutual: false },
      ],
    },
  ]);

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [filterMode, setFilterMode] = useState<"explore" | "myEvents">("explore");

  /**
   * Handle scroll to add glassmorphism effect to logo
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
    const event = new CustomEvent("meetupsScroll", { detail: isScrolled });
    window.dispatchEvent(event);
  }, [isScrolled]);

  /**
   * Toggle user's attendance for a meetup
   */
  const toggleAttendance = (meetupId: string) => {
    if (!address) {
      alert("Please connect your wallet to join meetups");
      return;
    }

    setMeetups((prevMeetups) => {
      const updatedMeetups = prevMeetups.map((meetup) => {
        if (meetup.id === meetupId) {
          const isAttending = meetup.attendees.some(
            (a) => a.id === currentUserId
          );

          if (isAttending) {
            // Show confirmation dialog before canceling
            const confirmCancel = confirm(
              "Are you sure you want to cancel your registration for this event?"
            );
            if (!confirmCancel) {
              return meetup; // Don't change anything if user cancels
            }

            const updatedMeetup = {
              ...meetup,
              attendees: meetup.attendees.filter((a) => a.id !== currentUserId),
            };

            // Update selectedMeetup immediately if this is the current detail view
            if (selectedMeetup && selectedMeetup.id === meetupId) {
              setSelectedMeetup(updatedMeetup);
            }

            return updatedMeetup;
          } else {
            if (meetup.attendees.length >= meetup.capacity) {
              alert("This meetup is at full capacity");
              return meetup;
            }

            const updatedMeetup = {
              ...meetup,
              attendees: [
                ...meetup.attendees,
                {
                  id: currentUserId,
                  name: "You",
                  avatar: "/icon.png",
                  isMutual: false,
                },
              ],
            };

            // Update selectedMeetup immediately if this is the current detail view
            if (selectedMeetup && selectedMeetup.id === meetupId) {
              setSelectedMeetup(updatedMeetup);
            }

            return updatedMeetup;
          }
        }
        return meetup;
      });

      return updatedMeetups;
    });
  };

  /**
   * Get sorted attendees with mutuals first
   */
  const getSortedAttendees = (attendees: Attendee[]) => {
    const mutuals = attendees.filter((a) => a.isMutual);
    const others = attendees.filter((a) => !a.isMutual);
    return [...mutuals, ...others];
  };

  // Filter meetups based on view mode
  const filteredMeetups = filterMode === "myEvents"
    ? meetups.filter((m) => m.attendees.some((a) => a.id === currentUserId))
    : meetups;

  const upcomingMeetups = filteredMeetups.filter((m) => !m.isPast);
  const pastMeetups = filteredMeetups.filter((m) => m.isPast);

  /**
   * Handle meetup card click
   */
  const handleMeetupClick = (meetup: Meetup) => {
    setSelectedMeetup(meetup);
    setViewMode("detail");
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedMeetup(null);
  };

  // Detail View
  if (viewMode === "detail" && selectedMeetup) {
    return (
      <div className="meetups-container" ref={containerRef}>
        <div className="meetup-detail-page">
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
            Back
          </button>

          <div
            className="meetup-detail-cover"
            style={{ backgroundImage: `url(${selectedMeetup.coverImage})` }}
          >
            {!selectedMeetup.isPast && (
              <div className="meetup-badge">
                {selectedMeetup.attendees.length}/{selectedMeetup.capacity}
              </div>
            )}
            {selectedMeetup.isPast && (
              <div className="meetup-badge past-badge">Past</div>
            )}
          </div>

          <div className="meetup-detail-content">
            <h3 className="meetup-detail-title">{selectedMeetup.title}</h3>

            <div className="meetup-detail-info">
              <div className="info-row">
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <div className="info-label">Date & Time</div>
                  <div className="info-value">
                    {selectedMeetup.date} at {selectedMeetup.time}
                  </div>
                </div>
              </div>

              <div className="info-row">
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div>
                  <div className="info-label">Location</div>
                  <div className="info-value">{selectedMeetup.location}</div>
                </div>
              </div>
            </div>

            <div className="meetup-detail-section">
              <h4 className="section-heading">About</h4>
              <p className="meetup-detail-description">
                {selectedMeetup.description}
              </p>
            </div>

            <div className="meetup-detail-section">
              <h4 className="section-heading">
                {selectedMeetup.isPast ? "Attended" : "Going"} (
                {selectedMeetup.attendees.length})
              </h4>
              <div className="attendees-list">
                {getSortedAttendees(selectedMeetup.attendees).map(
                  (attendee) => (
                    <div key={attendee.id} className="attendee-item">
                      <img
                        src={attendee.avatar}
                        alt={attendee.name}
                        className="attendee-item-avatar"
                      />
                      <div className="attendee-item-info">
                        <span className="attendee-name">
                          {attendee.name}
                          {attendee.isMutual && (
                            <span className="mutual-badge">Mutual</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {!selectedMeetup.isPast && (
              <button
                className={`join-btn ${
                  selectedMeetup.attendees.some((a) => a.id === currentUserId)
                    ? "attending"
                    : ""
                }`}
                onClick={() => toggleAttendance(selectedMeetup.id)}
              >
                {selectedMeetup.attendees.some(
                  (a) => a.id === currentUserId
                ) ? (
                  <>
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
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    You are going!
                  </>
                ) : (
                  "Join Meetup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="meetups-container" ref={containerRef}>
      <div className="meetups-header">
        <h2>Meetups</h2>
        <p className="meetups-subtitle">Connect with the Base community</p>
        
        {/* View mode toggle */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${filterMode === "explore" ? "active" : ""}`}
            onClick={() => setFilterMode("explore")}
          >
            Explore
          </button>
          <button
            className={`toggle-btn ${filterMode === "myEvents" ? "active" : ""}`}
            onClick={() => setFilterMode("myEvents")}
          >
            My Events
          </button>
        </div>
      </div>

      {/* Empty state for My Events */}
      {filterMode === "myEvents" && upcomingMeetups.length === 0 && pastMeetups.length === 0 && (
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h3>No events joined yet</h3>
          <p>Join meetups from the Explore tab to see them here</p>
          <button
            className="explore-btn"
            onClick={() => setFilterMode("explore")}
          >
            Explore Events
          </button>
        </div>
      )}

      {/* Upcoming meetups */}
      {upcomingMeetups.length > 0 && (
        <div className="meetups-section">
          <h3 className="section-title">Upcoming Events</h3>
          <div className="meetups-grid">
            {upcomingMeetups.map((meetup) => {
              const sortedAttendees = getSortedAttendees(meetup.attendees);

              return (
                <div
                  key={meetup.id}
                  className="meetup-card"
                  onClick={() => handleMeetupClick(meetup)}
                >
                  <div
                    className="meetup-cover"
                    style={{ backgroundImage: `url(${meetup.coverImage})` }}
                  >
                    <div className="meetup-badge">
                      {meetup.attendees.length}/{meetup.capacity}
                    </div>
                  </div>

                  <div className="meetup-content">
                    <h4 className="meetup-title">{meetup.title}</h4>

                    <div className="meetup-info">
                      <div className="info-row">
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
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{meetup.date} at {meetup.time}</span>
                      </div>

                      <div className="info-row">
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
                        <span>{meetup.location}</span>
                      </div>
                    </div>

                    <div className="meetup-attendees">
                      <div className="attendees-avatars">
                        {sortedAttendees.slice(0, 4).map((attendee, idx) => (
                          <img
                            key={attendee.id}
                            src={attendee.avatar}
                            alt={attendee.name}
                            className="attendee-avatar"
                            style={{ zIndex: 10 - idx }}
                            title={attendee.name + (attendee.isMutual ? " (Mutual)" : "")}
                          />
                        ))}
                        {meetup.attendees.length > 4 && (
                          <div className="attendee-more" style={{ zIndex: 6 }}>
                            +{meetup.attendees.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="attendees-count-compact">
                        {meetup.attendees.length} going
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past meetups */}
      {pastMeetups.length > 0 && (
        <div className="meetups-section">
          <h3 className="section-title">Past Events</h3>
          <div className="meetups-grid">
            {pastMeetups.map((meetup) => {
              const sortedAttendees = getSortedAttendees(meetup.attendees);

              return (
                <div
                  key={meetup.id}
                  className="meetup-card past"
                  onClick={() => handleMeetupClick(meetup)}
                >
                  <div
                    className="meetup-cover"
                    style={{ backgroundImage: `url(${meetup.coverImage})` }}
                  >
                    <div className="meetup-badge past-badge">Past</div>
                  </div>

                  <div className="meetup-content">
                    <h4 className="meetup-title">{meetup.title}</h4>

                    <div className="meetup-info">
                      <div className="info-row">
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
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{meetup.date} at {meetup.time}</span>
                      </div>

                      <div className="info-row">
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
                        <span>{meetup.location}</span>
                      </div>
                    </div>

                    <div className="meetup-attendees">
                      <div className="attendees-avatars">
                        {sortedAttendees.slice(0, 4).map((attendee, idx) => (
                          <img
                            key={attendee.id}
                            src={attendee.avatar}
                            alt={attendee.name}
                            className="attendee-avatar"
                            style={{ zIndex: 10 - idx }}
                          />
                        ))}
                        {meetup.attendees.length > 4 && (
                          <div className="attendee-more" style={{ zIndex: 6 }}>
                            +{meetup.attendees.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="attendees-count-compact">
                        {meetup.attendees.length} attended
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetups;

