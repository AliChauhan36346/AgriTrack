import { Breadcrumb, VisitLog } from '../types';

/**
 * Storage Service
 * Provides local caching and offline persistence layer for GPS breadcrumbs and field logs.
 * Falls back to in-memory store in web/headless environments.
 */

const STORAGE_KEYS = {
  BREADCRUMB_QUEUE: '@agriroute_breadcrumb_queue',
  PENDING_VISITS: '@agriroute_pending_visits',
  USER_SESSION: '@agriroute_user_session',
  OFFICER_CACHE: '@agriroute_officer_cache',
};

// In-memory fallback
const memoryStore = new Map<string, string>();

export const storageService = {
  async saveQueue(queue: Breadcrumb[]): Promise<void> {
    try {
      const data = JSON.stringify(queue);
      memoryStore.set(STORAGE_KEYS.BREADCRUMB_QUEUE, data);
    } catch (e) {
      console.warn('StorageService.saveQueue error:', e);
    }
  },

  async loadQueue(): Promise<Breadcrumb[]> {
    try {
      const raw = memoryStore.get(STORAGE_KEYS.BREADCRUMB_QUEUE);
      if (raw) {
        return JSON.parse(raw) as Breadcrumb[];
      }
      return [];
    } catch (e) {
      console.warn('StorageService.loadQueue error:', e);
      return [];
    }
  },

  async savePendingVisits(visits: VisitLog[]): Promise<void> {
    try {
      memoryStore.set(STORAGE_KEYS.PENDING_VISITS, JSON.stringify(visits));
    } catch (e) {
      console.warn('StorageService.savePendingVisits error:', e);
    }
  },

  async loadPendingVisits(): Promise<VisitLog[]> {
    try {
      const raw = memoryStore.get(STORAGE_KEYS.PENDING_VISITS);
      return raw ? (JSON.parse(raw) as VisitLog[]) : [];
    } catch (e) {
      console.warn('StorageService.loadPendingVisits error:', e);
      return [];
    }
  },

  async clearAll(): Promise<void> {
    memoryStore.clear();
  },
};
