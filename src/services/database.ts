import * as SQLite from 'expo-sqlite';
import { BreadcrumbPoint } from '../types';

/**
 * SQLite Local Database Service for AgriRoute Offline Queue
 * Database Name: agriroute_local.db
 */

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

interface LocationQueueRow {
  id: string;
  officer_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  battery_level: number | null;
  source: string | null;
  recorded_at: string;
  is_synced: number;
}

/**
 * Initialize and retrieve the SQLite database singleton instance.
 * Automatically runs table migrations on first startup.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync('agriroute_local.db');

      // Enable Write-Ahead Logging for high concurrency & execute table schema
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS location_queue (
          id TEXT PRIMARY KEY,
          officer_id TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          speed REAL,
          battery_level INTEGER,
          source TEXT DEFAULT 'mobile_app',
          recorded_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_location_queue_unsynced 
        ON location_queue (is_synced, recorded_at);
      `);

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database] Failed to open/initialize SQLite database:', error);
      throw error;
    } finally {
      dbInitPromise = null;
    }
  })();

  return dbInitPromise;
}

/**
 * Insert a location point into the local SQLite offline queue.
 * Returns the generated unique record ID.
 */
export async function insertLocation(point: Omit<BreadcrumbPoint, 'id'>): Promise<string> {
  try {
    const db = await getDatabase();
    const id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const officerId = point.officerId || 'off-01';
    const speed = point.speedKmh ?? point.speed ?? 0;
    const batteryLevel = point.batteryLevel ?? 100;
    const source = point.source ?? 'mobile_app';
    const recordedAt = point.recordedAt || new Date().toISOString();
    const isSynced = point.isSynced ? 1 : 0;

    await db.runAsync(
      `INSERT INTO location_queue (
        id, officer_id, latitude, longitude, speed, battery_level, source, recorded_at, is_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        officerId,
        point.latitude,
        point.longitude,
        speed,
        batteryLevel,
        source,
        recordedAt,
        isSynced,
      ]
    );

    return id;
  } catch (error) {
    console.error('[Database] insertLocation error:', error);
    throw error;
  }
}

/**
 * Retrieve count of unsynced location records currently queued in SQLite.
 */
export async function getUnsyncedCount(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM location_queue WHERE is_synced = 0`
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error('[Database] getUnsyncedCount error:', error);
    return 0;
  }
}

/**
 * Fetch a batch of unsynced location records ordered by timestamp ascending.
 */
export async function getUnsyncedBatch(limit = 50): Promise<BreadcrumbPoint[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<LocationQueueRow>(
      `SELECT id, officer_id, latitude, longitude, speed, battery_level, source, recorded_at, is_synced
       FROM location_queue
       WHERE is_synced = 0
       ORDER BY recorded_at ASC
       LIMIT ?`,
      [limit]
    );

    return rows.map((row) => ({
      id: row.id,
      officerId: row.officer_id,
      latitude: row.latitude,
      longitude: row.longitude,
      speedKmh: row.speed ?? 0,
      speed: row.speed ?? 0,
      batteryLevel: row.battery_level ?? 100,
      source: row.source === 'hardware_tracker' ? 'hardware_tracker' : 'mobile_app',
      recordedAt: row.recorded_at,
      isSynced: row.is_synced === 1,
    }));
  } catch (error) {
    console.error('[Database] getUnsyncedBatch error:', error);
    return [];
  }
}

/**
 * Mark specified location record IDs as successfully synced (is_synced = 1).
 */
export async function markPointsAsSynced(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;

  try {
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE location_queue SET is_synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  } catch (error) {
    console.error('[Database] markPointsAsSynced error:', error);
    throw error;
  }
}

/**
 * Purge synced records older than a specified number of days to prevent unbounded local storage growth.
 */
export async function purgeOldSyncedPoints(olderThanDays = 7): Promise<void> {
  try {
    const db = await getDatabase();
    const cutoffDate = new Date(Date.now() - olderThanDays * 86400000).toISOString();
    await db.runAsync(
      `DELETE FROM location_queue WHERE is_synced = 1 AND recorded_at < ?`,
      [cutoffDate]
    );
  } catch (error) {
    console.error('[Database] purgeOldSyncedPoints error:', error);
    throw error;
  }
}
