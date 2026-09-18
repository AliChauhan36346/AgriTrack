# AgriRoute — Offline-First Field GPS Tracking App

AgriRoute is an enterprise mobile application engineered with **Expo (React Native)** and **TypeScript**, specifically tailored for agricultural field officers, agronomists, and agro-dealer shop owners. Built with **Stitch design tokens**, robust offline queuing, and high-performance GPS route tracking.

---

## 🌾 Key Features

1. **Role Selection & Quick Auth**:
   - Clean switch between **Field Officer** and **Shop Owner / Admin**.
   - 6-Digit SMS OTP verification with auto-focus traversal and accessible touch targets (≥ 48dp).

2. **Field Officer Tracking Dashboard**:
   - Header with dynamic status badge (`online` | `offline` | `syncing` | `stationary`).
   - Sticky `SyncBanner` displaying local offline queue count with one-tap "Sync Now" action.
   - Large Primary Shift Button ("Start Shift" / "End Shift") toggling live breadcrumb capture.
   - 3-Column `MetricCounter` row: **Distance (km)**, **Dealer Visits**, and **Queued Pings**.
   - Reusable `ActionCard` buttons for dealer check-ins and day summary.

3. **Geotagged Dealer Visit Check-in**:
   - Quick check-in modal automatically capturing current GPS coordinates, dealer name, and observation notes.
   - Saves directly to local offline queue when network is unavailable.

4. **Owner Live Fleet Overview**:
   - High-fidelity cartographic map container rendering active officer `LiveMarker` pins (with speed & heading indicators) and stale `OfflineMarker` pins.
   - Floating pill filter bar: **All Fleet**, **Active**, and **Offline**.
   - Bottom sheet drawer with real-time speeds, battery percentages, and last ping timestamps.

5. **Route Playback & Dwell Stops**:
   - Historical route polyline in Stitch Accent Blue (`#2563EB`).
   - Highlighted `StopPin` markers with dwell-time callouts (e.g. "Stopped: 45 min").
   - Docked audio/video-style `PlaybackScrubber` with play/pause, seekable progress bar, and speed toggles (`1x`, `2x`).

6. **Hardware GPS Tracker Linker**:
   - Viewport camera scanner with animated laser guidelines and corner target brackets.
   - Fallback 15-digit IMEI manual input with validation.
   - Officer selector dropdown and cryptographic pairing action.

---

## 🎨 Stitch Design Tokens

| Token | Hex | Semantic Use |
|---|---|---|
| **Primary** | `#0F5132` | Deep Emerald brand color, headers, primary buttons |
| **Primary Light** | `#D1E7DD` | Agri-Mint badges, active pill backgrounds |
| **Accent Blue** | `#2563EB` | Route polylines, playback controls, telemetry |
| **Warning Amber** | `#D97706` | Offline banners, low battery, stale markers |
| **Neutral Dark** | `#0F172A` | Slate Charcoal headings, high-contrast labels |
| **Surface Light** | `#F8FAFC` | App background, screens, lists |
| **Card Surface** | `#FFFFFF` | Elevated 16px rounded surface cards |

---

## 📂 Project Structure

```
/
├── App.tsx
├── index.js
├── app.json
├── package.json
├── tsconfig.json
├── /src
│   ├── /types            # TypeScript declarations (Officer, Breadcrumb, Stop, Role, etc.)
│   ├── /mockData         # Rich mock data for officers, routes, stops, and trackers
│   ├── /theme            # Colors, typography, spacing, and elevation tokens
│   ├── /store            # Zustand stores: authStore, trackingStore, filterStore
│   ├── /services         # storageService, syncWorker, locationService
│   ├── /hooks            # useNetworkStatus, useGeolocation, useOfficerRoute
│   ├── /components
│   │   ├── /ui           # StatusBadge, ActionCard, MetricCounter, PlaybackScrubber, Button, Card, Input
│   │   ├── /map          # LiveMarker, OfflineMarker, RoutePolyline, StopPin, MapContainer
│   │   └── /feedback     # SyncBanner, BatteryIndicator
│   ├── /navigation       # AuthNavigator, OfficerTabs, OwnerTabs, RootNavigator
│   └── /screens
│       ├── /auth         # RoleSelectScreen, PhoneAuthScreen
│       ├── /officer      # OfficerDashboardScreen, VisitLogModal
│       └── /owner        # OwnerLiveMapScreen, RoutePlaybackScreen, LinkTrackerScreen
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Expo Development Server
```bash
npx expo start
```
- Press `w` to open in browser (Web preview).
- Scan QR code with Expo Go on Android / iOS device.

### 3. Type Checking
```bash
npm run ts:check
```
