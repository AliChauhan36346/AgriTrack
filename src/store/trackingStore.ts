import { create } from 'zustand';
import { BreadcrumbPoint, VisitLog } from '../types';
import { mockVisitLogs, MOCK_ROUTE_BREADCRUMBS, MOCK_OFFICERS } from '../mockData';
import { getUnsyncedCount, insertLocation } from '../services/database';
import {
  requestLocationPermissions,
  startTracking,
  stopTracking,
} from '../services/backgroundLocation';

export interface TrackingState {
  // Required state
  isShiftActive: boolean;
  unsyncedCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;

  // Telemetry & metrics state
  shiftStartTime: number | null;
  currentBreadcrumb: BreadcrumbPoint | null;
  offlineQueue: BreadcrumbPoint[];
  syncedBreadcrumbs: BreadcrumbPoint[];
  visitLogs: VisitLog[];
  distanceKm: number;
  visitsCount: number;
  batteryLevel: number;
  isCharging: boolean;
  isSimulatedOffline: boolean;

  // Required actions
  startShift: (officerId?: string) => Promise<boolean>;
  endShift: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  refreshUnsyncedCount: () => Promise<number>;
  triggerSync: () => Promise<number>;

  // Extended actions for backwards compatibility
  toggleShift: (officerId?: string) => void;
  enqueueBreadcrumb: (breadcrumb: Omit<BreadcrumbPoint, 'id' | 'isSynced'>) => Promise<string>;
  syncQueue: () => Promise<number>;
  clearQueue: () => void;
  addVisitLog: (log: Omit<VisitLog, 'id' | 'timestamp' | 'syncStatus'>) => void;
  setBattery: (level: number, isCharging?: boolean) => void;
  toggleSimulatedOffline: () => void;
}

let syncHandler: (() => Promise<{ success: boolean; syncedCount: number }>) | null = null;

export function registerSyncHandler(handler: () => Promise<{ success: boolean; syncedCount: number }>) {
  syncHandler = handler;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  isShiftActive: false,
  unsyncedCount: 0,
  isOnline: true,
  isSyncing: false,
  lastSyncTime: '18 mins ago',

  shiftStartTime: null,
  currentBreadcrumb: MOCK_ROUTE_BREADCRUMBS[MOCK_ROUTE_BREADCRUMBS.length - 1],
  offlineQueue: [],
  syncedBreadcrumbs: MOCK_ROUTE_BREADCRUMBS,
  visitLogs: mockVisitLogs,
  distanceKm: MOCK_OFFICERS[0].todayDistanceKm ?? 42.8,
  visitsCount: MOCK_OFFICERS[0].todayVisitsCount ?? 6,
  batteryLevel: MOCK_OFFICERS[0].batteryLevel,
  isCharging: false,
  isSimulatedOffline: false,

  startShift: async (officerId?: string) => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return false;
    }

    const targetOfficerId = officerId || 'off-01';
    await startTracking(targetOfficerId);

    set({
      isShiftActive: true,
      shiftStartTime: Date.now(),
    });

    return true;
  },

  endShift: async () => {
    await stopTracking();

    set({
      isShiftActive: false,
      shiftStartTime: null,
    });

    // Trigger a final sync attempt for any remaining points in the queue
    await get().triggerSync();
  },

  toggleShift: (officerId?: string) => {
    if (get().isShiftActive) {
      get().endShift().catch(() => {});
    } else {
      get().startShift(officerId).catch(() => {});
    }
  },

  setOnlineStatus: (isOnline: boolean) => {
    const wasOffline = !get().isOnline;
    set({ isOnline });

    // When transitioning from offline to online, trigger sync if items are queued
    if (wasOffline && isOnline && get().unsyncedCount > 0) {
      get().triggerSync().catch(() => {});
    }
  },

  refreshUnsyncedCount: async () => {
    try {
      const count = await getUnsyncedCount();
      set({ unsyncedCount: count });
      return count;
    } catch {
      return get().unsyncedCount;
    }
  },

  triggerSync: async () => {
    if (get().isSyncing) return 0;
    if (!syncHandler) return 0;
    try {
      const result = await syncHandler();
      return result.syncedCount;
    } catch (error) {
      console.warn('[trackingStore] triggerSync error:', error);
      return 0;
    }
  },

  enqueueBreadcrumb: async (data) => {
    const isOnline = get().isOnline && !get().isSimulatedOffline;
    const nowIso = new Date().toISOString();

    const newPointData: Omit<BreadcrumbPoint, 'id'> = {
      officerId: data.officerId || 'off-01',
      latitude: data.latitude,
      longitude: data.longitude,
      speedKmh: data.speedKmh ?? data.speed ?? 0,
      batteryLevel: data.batteryLevel ?? get().batteryLevel,
      source: data.source ?? 'mobile_app',
      recordedAt: data.recordedAt ?? nowIso,
      isSynced: false,
    };

    try {
      // Insert into local SQLite database
      const id = await insertLocation(newPointData);
      const fullPoint: BreadcrumbPoint = { ...newPointData, id };

      set((state) => ({
        currentBreadcrumb: fullPoint,
        distanceKm: Number((state.distanceKm + 0.12).toFixed(1)),
      }));

      // Refresh SQLite unsynced count
      await get().refreshUnsyncedCount();

      // If online and not simulated offline, trigger background sync
      if (isOnline) {
        get().triggerSync().catch(() => {});
      }

      return id;
    } catch (error) {
      console.error('[trackingStore] enqueueBreadcrumb error:', error);
      return '';
    }
  },

  syncQueue: async () => {
    return await get().triggerSync();
  },

  clearQueue: () => {
    set({ unsyncedCount: 0, offlineQueue: [] });
  },

  addVisitLog: (logData) => {
    const newLog: VisitLog = {
      ...logData,
      id: `vl-${Date.now()}`,
      timestamp: Date.now(),
      syncStatus: get().isOnline && !get().isSimulatedOffline ? 'synced' : 'queued',
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
    const newOffline = !get().isSimulatedOffline;
    set({ isSimulatedOffline: newOffline });
    get().setOnlineStatus(!newOffline);
  },
}));

// Initialize initial unsynced count from SQLite on startup
getUnsyncedCount().then((count) => {
  useTrackingStore.setState({ unsyncedCount: count });
}).catch(() => {});
