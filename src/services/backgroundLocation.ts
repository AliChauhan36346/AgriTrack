import { Alert, Linking } from 'react-native';
import BackgroundGeolocation, {
  DesiredAccuracy,
  AuthorizationStatus,
  Location,
  MotionChangeEvent,
} from 'react-native-background-geolocation';
import { insertLocation } from './database';
import { useTrackingStore } from '../store/trackingStore';

/**
 * Background Location Service for AgriRoute
 * Powered by @transistorsoft/react-native-background-geolocation.
 * Buffers all real device GPS coordinates directly into the local SQLite database.
 */

let isConfigured = false;
let activeOfficerId: string = 'off-01';

/**
 * Request runtime and background location permissions from user.
 * Displays a native alert dialog on rejection directing the user to device settings.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const status = await BackgroundGeolocation.requestPermission();

    if (
      status === AuthorizationStatus.Always ||
      status === AuthorizationStatus.WhenInUse
    ) {
      return true;
    }

    Alert.alert(
      'Location Permission Required',
      'AgriRoute requires background location access to record and verify your agricultural field route even when your phone is in your pocket or screen is locked.\n\nPlease choose "Allow all the time" in device settings.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings().catch(() => {});
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );

    return false;
  } catch (error) {
    console.warn('[BackgroundLocation] Permission request fallback:', error);
    // Return true in development/fallback environments so shift flow can proceed
    return true;
  }
}

/**
 * Configure BackgroundGeolocation with production settings:
 * - desiredAccuracy: HIGH
 * - distanceFilter: 30m
 * - stationaryRadius: 25m
 * - stopTimeout: 5m
 * - Foreground service notification with title & text
 * - stopOnTerminate: false & startOnBoot: true
 */
export async function initBackgroundGeolocation(): Promise<void> {
  if (isConfigured) return;

  try {
    // 1. Subscribe to Location Events
    BackgroundGeolocation.onLocation(
      async (location: Location) => {
        try {
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          // Convert speed from m/s to km/h
          const speedKmh = Math.max(0, Math.round((location.coords.speed || 0) * 3.6));
          // Convert battery level (0.0 - 1.0) to percentage (0 - 100)
          const batteryPct = Math.min(100, Math.max(0, Math.round((location.battery?.level ?? 1) * 100)));
          const isCharging = Boolean(location.battery?.is_charging);
          const recordedAt = String(location.timestamp || new Date().toISOString());

          // Write coordinate into local SQLite queue immediately
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

          // Update store telemetry and live metrics
          const trackingStore = useTrackingStore.getState();
          await trackingStore.refreshUnsyncedCount();
          trackingStore.setBattery(batteryPct, isCharging);

          // Update cumulative distance traveled if odometer reading is available
          if (location.odometer && location.odometer > 0) {
            const currentDist = Number((location.odometer / 1000).toFixed(1));
            useTrackingStore.setState({ distanceKm: currentDist });
          }

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

          // Trigger background sync if device is currently online
          if (trackingStore.isOnline && !trackingStore.isSimulatedOffline) {
            trackingStore.triggerSync().catch(() => {});
          }
        } catch (err) {
          console.error('[BackgroundLocation] Failed to process location event:', err);
        }
      },
      (error) => {
        console.warn('[BackgroundLocation] onLocation error:', error);
      }
    );

    // 2. Subscribe to Motion Change Events (stationary <-> moving)
    BackgroundGeolocation.onMotionChange((event: MotionChangeEvent) => {
      console.log(
        `[BackgroundLocation] Officer motion change: isMoving=${event.isMoving}, activity=${event.location?.activity?.type || 'unknown'}`
      );
    });

    // 3. Configure and Ready BackgroundGeolocation with strict Config types
    await BackgroundGeolocation.ready({
      reset: false,
      geolocation: {
        desiredAccuracy: DesiredAccuracy.High,
        distanceFilter: 30,
        stationaryRadius: 25,
        stopTimeout: 5,
      },
      app: {
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        notification: {
          title: 'AgriRoute Active',
          text: 'Tracking route for shift verification',
          color: '#0F5132',
        },
      },
    });

    isConfigured = true;
  } catch (error) {
    console.warn('[BackgroundLocation] initBackgroundGeolocation warning:', error);
  }
}

/**
 * Start real background GPS tracking for specified officer during shift.
 */
export async function startTracking(officerId: string): Promise<void> {
  activeOfficerId = officerId || 'off-01';

  try {
    if (!isConfigured) {
      await initBackgroundGeolocation();
    }
    await BackgroundGeolocation.start();
  } catch (error) {
    console.warn('[BackgroundLocation] BackgroundGeolocation.start fallback:', error);
  }
}

/**
 * Stop background GPS tracking when shift ends.
 */
export async function stopTracking(): Promise<void> {
  try {
    await BackgroundGeolocation.stop();
  } catch (error) {
    console.warn('[BackgroundLocation] BackgroundGeolocation.stop fallback:', error);
  }
}
