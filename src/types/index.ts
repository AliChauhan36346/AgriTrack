/**
 * AgriRoute Master TypeScript Declarations
 * Strictly typed definitions for FieldOfficer, BreadcrumbPoint, OfficerStop, UserRole, and State stores.
 */

export type UserRole = 'owner' | 'officer';

export type OfficerStatus = 'active' | 'stationary' | 'offline' | 'online' | 'syncing';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface BreadcrumbPoint {
  id: string;
  officerId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  batteryLevel: number;
  source: 'mobile_app' | 'hardware_tracker';
  recordedAt: string;
  // Optional/computed fields for extended telemetry & backward compatibility
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number;
  isSynced?: boolean;
}

// Backward-compatible alias
export type Breadcrumb = BreadcrumbPoint;

export interface ShopOwnerAccount {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  pin: string; // 4-digit security PIN for owner login
  email?: string;
  city: string;
  createdAt: string;
}

export interface FieldOfficer {
  id: string;
  fullName: string;
  phone: string;
  assignedTerritory: string;
  currentStatus: OfficerStatus;
  batteryLevel: number; // 0 - 100
  speedKmh: number; // km/h
  lastSeenAt: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp?: number;
  };
  hasHardwareTracker: boolean;
  trackerImei?: string;
  accessCode: string; // Unique login code (e.g. 'FO-101', 'FO-4892')
  ownerId?: string; // ID of shop owner who registered this officer
  email?: string;
  
  // Working Hours & Shift Schedule (set by Shop Owner)
  shiftStartTime?: string; // e.g. "09:00"
  shiftEndTime?: string;   // e.g. "18:00"
  workingHoursDisplay?: string; // e.g. "09:00 AM - 06:00 PM"

  // Backward compatibility fields
  name?: string;
  roleTitle?: string;
  status?: OfficerStatus;
  isCharging?: boolean;
  lastPingTime?: string;
  todayDistanceKm?: number;
  todayVisitsCount?: number;
  queuedPingsCount?: number;
  avatarUrl?: string;
}

// Backward-compatible alias
export type Officer = FieldOfficer;

export interface OfficerStop {
  id: string;
  officerId: string;
  latitude: number;
  longitude: number;
  stopName: string;
  arrivedAt: string;
  departedAt: string;
  durationMinutes: number;

  // Backward compatibility fields
  dealerName?: string;
  dwellMinutes?: number;
  location?: GeoCoordinate;
  address?: string;
  arrivalTime?: string;
  departureTime?: string;
  purpose?: string;
  notes?: string;
  contactPerson?: string;
}

// Backward-compatible alias
export type RouteStop = OfficerStop;

export interface VisitLog {
  id: string;
  dealerName: string;
  officerId: string;
  officerName: string;
  purpose: 'Pesticide Order' | 'Fertilizer Inspection' | 'Seed Sampling' | 'Payment Collection' | 'General Follow-up';
  notes: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  syncStatus: 'queued' | 'synced';
  amountCollected?: number;
}

export interface HardwareTracker {
  id: string;
  imei: string;
  model: string;
  assignedOfficerId?: string;
  batteryLevel: number;
  status: 'active' | 'unpaired' | 'low_battery';
  lastSignalTime: string;
  firmwareVersion: string;
}

export type MapFilterType = 'all' | 'active' | 'offline';

export type PlaybackSpeed = 1 | 2;

export interface ShiftStats {
  distanceKm: number;
  visitsCount: number;
  queuedCount: number;
  durationMinutes: number;
  avgSpeedKmh: number;
}
