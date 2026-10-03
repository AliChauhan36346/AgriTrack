import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { insertLocation } from './database';
import { useTrackingStore } from '../store/trackingStore';

export const BACKGROUND_LOCATION_TASK = 'AGRITRACK_BACKGROUND_LOCATION_TASK';

let activeOfficerId: string = 'off-01';

// Register background location task with Expo TaskManager (100% free & open source, zero license keys)
if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[BackgroundLocation Task Error]:', error.message);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (!locations || locations.length === 0) return;

      for (const loc of locations) {
        try {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          const speedKmh = Math.max(0, Math.round((loc.coords.speed || 0) * 3.6));
          const recordedAt = new Date(loc.timestamp).toISOString();

          // Read current store state
          const store = useTrackingStore.getState();
          const batteryPct = store.batteryLevel || 85;

          // Buffer coordinate into local SQLite queue immediately
          await insertLocation({
            officerId: activeOfficerId,
            latitude: lat,
            longitude: lng,
            speedKmh,
            speed: speedKmh,
            batteryLevel: batteryPct,
            source: 'mobile_app',
            recordedAt,
            isSynced: false,
          });

          // Refresh unsynced count and update live breadcrumb
          await store.refreshUnsyncedCount();
          useTrackingStore.setState({
            currentBreadcrumb: {
              id: `loc_${Date.now()}`,
              officerId: activeOfficerId,
              latitude: lat,
              longitude: lng,
              speedKmh,
              batteryLevel: batteryPct,
              source: 'mobile_app',
              recordedAt,
              isSynced: false,
            },
          });

          // Trigger automatic background sync if device is currently online
          if (store.isOnline && !store.isSimulatedOffline) {
            store.triggerSync().catch(() => {});
          }
        } catch (err) {
          console.error('[BackgroundLocation] Failed to process location point:', err);
        }
      }
    }
  });
}

/**
 * Request runtime foreground and background location permissions from user.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        'لوکیشن اجازت درکار ہے (Location Permission Required)',
        'AgriRoute requires location access to record and verify your agricultural field route during shift.\n\nPlease enable location permission in settings.',
        [
          { text: 'اوپن سیٹنگز (Open Settings)', onPress: () => Linking.openSettings().catch(() => {}) },
          { text: 'منسوخ (Cancel)', style: 'cancel' },
        ]
      );
      return false;
    }

    // Request background permission for shift tracking
    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== Location.PermissionStatus.GRANTED) {
      console.warn('[BackgroundLocation] Background permission not granted, tracking in foreground');
    }

    return true;
  } catch (error) {
    console.warn('[BackgroundLocation] Permission request fallback:', error);
    return true;
  }
}

/**
 * Configure / initialize background location service
 */
export async function initBackgroundGeolocation(): Promise<void> {
  // Expo TaskManager task is registered statically on module load
}

/**
 * Start real background GPS tracking for specified officer during shift.
 */
export async function startTracking(officerId: string): Promise<void> {
  activeOfficerId = officerId || 'off-01';

  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 30, // record every 30 meters
      timeInterval: 10000,  // or every 10 seconds
      deferredUpdatesInterval: 10000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'AgriRoute Active (ڈیوٹی جاری ہے)',
        notificationBody: 'شفت لوکیشن ٹریکنگ فعال ہے (Tracking shift route)',
        notificationColor: '#0F5132',
      },
      pausesUpdatesAutomatically: false,
    });
  } catch (error) {
    console.warn('[BackgroundLocation] startTracking warning:', error);
  }
}

/**
 * Stop background GPS tracking when shift ends.
 */
export async function stopTracking(): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.warn('[BackgroundLocation] stopTracking warning:', error);
  }
}
