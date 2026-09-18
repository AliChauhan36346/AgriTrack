import { create } from 'zustand';
import { BreadcrumbPoint, VisitLog } from '../types';
import { mockVisitLogs, MOCK_ROUTE_BREADCRUMBS, MOCK_OFFICERS } from '../mockData';

interface TrackingState {
  isShiftActive: boolean;
  shiftStartTime: number | null;
  currentBreadcrumb: BreadcrumbPoint | null;
  offlineQueue: BreadcrumbPoint[];
  syncedBreadcrumbs: BreadcrumbPoint[];
  visitLogs: VisitLog[];
  distanceKm: number;
  visitsCount: number;
  batteryLevel: number;
  isCharging: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  isSimulatedOffline: boolean;

  // Actions
  toggleShift: () => void;
  startShift: () => void;
  endShift: () => void;
  enqueueBreadcrumb: (breadcrumb: Omit<BreadcrumbPoint, 'id' | 'isSynced'>) => void;
  syncQueue: () => Promise<number>;
  clearQueue: () => void;
  addVisitLog: (log: Omit<VisitLog, 'id' | 'timestamp' | 'syncStatus'>) => void;
  setBattery: (level: number, isCharging?: boolean) => void;
  toggleSimulatedOffline: () => void;
}

// 14 unsynced local queue points for realistic offline tracking simulation
const INITIAL_OFFLINE_QUEUE: BreadcrumbPoint[] = Array.from({ length: 14 }, (_, i) => ({
  id: `bc-unsynced-${i + 1}`,
  officerId: 'off-01',
  latitude: Number((22.3430 + i * 0.0018).toFixed(4)),
  longitude: Number((73.2195 + i * 0.0015).toFixed(4)),
  speedKmh: Math.floor(25 + (i % 5) * 4),
  speed: Math.floor(25 + (i % 5) * 4),
  heading: 42,
  batteryLevel: Math.max(70, 84 - Math.floor(i / 2)),
  source: i % 2 === 0 ? 'hardware_tracker' : 'mobile_app',
  recordedAt: `11:${String(35 + i).padStart(2, '0')} AM`,
  accuracy: 4,
  altitude: 55,
  timestamp: Date.now() - (14 - i) * 60000,
  isSynced: false,
}));

export const useTrackingStore = create<TrackingState>((set, get) => ({
  isShiftActive: true,
  shiftStartTime: Date.now() - 3600000 * 4, // 4 hours ago
  currentBreadcrumb: MOCK_ROUTE_BREADCRUMBS[MOCK_ROUTE_BREADCRUMBS.length - 1],
  offlineQueue: INITIAL_OFFLINE_QUEUE,
  syncedBreadcrumbs: MOCK_ROUTE_BREADCRUMBS,
  visitLogs: mockVisitLogs,
  distanceKm: MOCK_OFFICERS[0].todayDistanceKm ?? 42.8,
  visitsCount: MOCK_OFFICERS[0].todayVisitsCount ?? 6,
  batteryLevel: MOCK_OFFICERS[0].batteryLevel,
  isCharging: false,
  isSyncing: false,
  lastSyncTime: '18 mins ago',
  isSimulatedOffline: false,

  toggleShift: () => {
    const currentState = get().isShiftActive;
    if (currentState) {
      get().endShift();
    } else {
      get().startShift();
    }
  },

  startShift: () => {
    set({
      isShiftActive: true,
      shiftStartTime: Date.now(),
    });
  },

  endShift: () => {
    set({
      isShiftActive: false,
      shiftStartTime: null,
    });
  },

  enqueueBreadcrumb: (data) => {
    const newPoint: BreadcrumbPoint = {
      ...data,
      id: `bc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speedKmh: data.speedKmh ?? data.speed ?? 0,
      batteryLevel: data.batteryLevel ?? get().batteryLevel,
      source: data.source ?? 'mobile_app',
      recordedAt: data.recordedAt ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSynced: !get().isSimulatedOffline,
    };

    if (get().isSimulatedOffline) {
      set((state) => ({
        currentBreadcrumb: newPoint,
        offlineQueue: [...state.offlineQueue, newPoint],
        distanceKm: Number((state.distanceKm + 0.12).toFixed(1)),
      }));
    } else {
      set((state) => ({
        currentBreadcrumb: newPoint,
        syncedBreadcrumbs: [...state.syncedBreadcrumbs, newPoint],
        distanceKm: Number((state.distanceKm + 0.12).toFixed(1)),
      }));
    }
  },

  syncQueue: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return 0;

    set({ isSyncing: true });
    // Simulate network transmission of offline points
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const syncedBatch = queue.map((pt) => ({ ...pt, isSynced: true }));
    const count = queue.length;

    set((state) => ({
      isSyncing: false,
      offlineQueue: [],
      syncedBreadcrumbs: [...state.syncedBreadcrumbs, ...syncedBatch],
      lastSyncTime: 'Just now',
    }));

    return count;
  },

  clearQueue: () => set({ offlineQueue: [] }),

  addVisitLog: (logData) => {
    const newLog: VisitLog = {
      ...logData,
      id: `vl-${Date.now()}`,
      timestamp: Date.now(),
      syncStatus: get().isSimulatedOffline ? 'queued' : 'synced',
    };

    set((state) => ({
      visitLogs: [newLog, ...state.visitLogs],
      visitsCount: state.visitsCount + 1,
    }));
  },

  setBattery: (level: number, isCharging = false) => {
    set({ batteryLevel: level, isCharging });
  },

  toggleSimulatedOffline: () => {
    set((state) => ({ isSimulatedOffline: !state.isSimulatedOffline }));
  },
}));
