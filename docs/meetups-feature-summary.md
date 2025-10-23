# Meetups Feature Summary

## Overview
The Meetups feature allows users to discover, join, and engage with Base community events. The interface is inspired by Luma's event website, featuring beautiful card-based layouts and a clean design that matches the basemaps Base blue color scheme.

## Implementation Date
October 23, 2025

## Features

### 1. Navigation
- Added a new "Meetups" tab to the bottom navigation bar
- Icon: Users/people group icon (Feather icon style)
- Positioned between Home and Profile tabs

### 2. Event Display
- **Upcoming Events**: Shows future meetups users can join
- **Past Events**: Shows historical meetups for reference
- Card-based layout inspired by Luma event platform

### 3. Event Cards
Each event card displays:
- Cover image
- Event title
- Date and time
- Location (virtual or physical)
- Full description
- Attendee count with capacity (e.g., "24/100")
- Attendee avatars (shows first 4, then "+X more")
- Join/Attending button

### 4. Attendee Management
- Users can join/leave upcoming meetups
- Wallet connection required to join
- Capacity limits enforced
- Attendees displayed with **mutuals first**, then others
- Expandable attendee list showing all participants
- Mutual connections marked with a blue "Mutual" badge

### 5. Sample Meetups
Three Base community events added:

#### Base Around the World
- **Type**: Virtual Event
- **Date**: November 15, 2025, 3:00 PM UTC
- **Description**: Global gathering of Base community members
- **Capacity**: 500 people

#### Base Onchain Hackathon Dinner
- **Type**: In-person
- **Location**: 123 Blockchain Ave, San Francisco, CA
- **Date**: December 5, 2025, 7:00 PM PST
- **Description**: Celebration dinner with project showcases
- **Capacity**: 100 people

#### Base Builder Meetup - NYC (Past Event)
- **Type**: In-person
- **Location**: Base HQ, New York, NY
- **Date**: October 10, 2025, 6:00 PM EST
- **Description**: NYC builder networking event
- **Status**: Past event

### 6. Mutual Connections
- Alice is configured as a mutual connection for testing
- Mutual attendees are shown first in the attendee list
- Mutual badge indicates shared connections

## Technical Details

### Files Created/Modified

#### New Files
- `components/Meetups.tsx` - Main meetups component

#### Modified Files
- `app/page.tsx` - Added Meetups tab to navigation
- `app/globals.css` - Added comprehensive meetup styles

### Component Structure
```typescript
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
```

### Key Functions
- `toggleAttendance()` - Join/leave meetups
- `getSortedAttendees()` - Sort attendees with mutuals first
- State management for expanded attendee lists

## Design System

### Color Palette (Base Theme)
- Primary Blue: `#0052FF` (var(--base-blue))
- White: `#FFFFFF` (var(--base-white))
- Gray Scale: 50, 100, 200, 400, 600, 900

### Typography
- Font: Inter
- Titles: 700 weight, -0.5px letter spacing
- Body: 500-600 weight
- Monospace: SFMono-Regular (for addresses)

### Card Design
- Border radius: 16px
- Box shadow: 0 2px 12px rgba(0, 0, 0, 0.06)
- Hover effect: translateY(-2px) with increased shadow
- Border: 1px solid var(--base-gray-200)

### Interactive Elements
- Buttons use Base blue with hover effects
- Smooth transitions (0.2-0.3s ease)
- Attending state: white background with blue border

## User Experience

### Joining Meetups
1. User clicks "Join Meetup" button
2. System checks wallet connection
3. System checks capacity
4. User added to attendee list
5. Button changes to "Attending" state

### Viewing Attendees
1. Click "View Attendees" button
2. Expandable list shows all participants
3. Mutuals displayed first with badge
4. Scrollable if many attendees
5. Click "Hide Attendees" to collapse

### Past Events
- Grayed out with "Past" badge
- No join functionality
- Shows final attendee count
- Preserved for community history

## Responsive Design
- Mobile-first approach
- Single column on mobile
- Two columns on tablet/desktop (≥768px)
- Safe area support for iOS notch
- Scrollable content with fixed navigation

## Future Enhancements
Potential improvements:
- RSVP reminders
- Calendar integration
- Meetup creation for organizers
- Photos/recaps for past events
- Check-in functionality
- Direct messaging with attendees
- Filter by location/type
- Search functionality

## Testing
- Wallet connection validation tested
- Capacity limits enforced
- Mutual connections display correctly
- Responsive layout verified
- Navigation integration working


