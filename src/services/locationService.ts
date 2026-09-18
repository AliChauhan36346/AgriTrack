import { Breadcrumb } from '../types';

/**
 * LocationService
 * High-performance location tracker interface.
 * Implements realistic location stream simulation and coordinate jitter reduction.
 */

type LocationCallback = (location: Omit<Breadcrumb, 'id' | 'isSynced'>) => void;

class LocationService {
  private watcherId: ReturnType<typeof setInterval> | null = null;
  private isTracking = false;
  private currentLatitude = 22.3072;
  private currentLongitude = 73.1812;
  private currentHeading = 45;
  private currentSpeed = 32;

  /**
   * Start tracking location at defined frequency (e.g. every 10 seconds)
   */
  public startTracking(officerId: string, onUpdate: LocationCallback, intervalMs = 8000): void {
    if (this.isTracking) return;

    this.isTracking = true;

    // Immediate initial ping
    onUpdate({
      officerId,
      latitude: this.currentLatitude,
      longitude: this.currentLongitude,
      speedKmh: this.currentSpeed,
      speed: this.currentSpeed,
      heading: this.currentHeading,
      batteryLevel: 84,
      source: 'mobile_app',
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      accuracy: 4,
      altitude: 48,
      timestamp: Date.now(),
    });

    this.watcherId = setInterval(() => {
      // Simulate realistic route progression with minor heading drift
      const deltaLat = (Math.random() - 0.3) * 0.0012;
      const deltaLng = (Math.random() - 0.2) * 0.0015;

      this.currentLatitude += deltaLat;
      this.currentLongitude += deltaLng;
      this.currentHeading = (this.currentHeading + Math.floor(Math.random() * 10 - 5) + 360) % 360;
      this.currentSpeed = Math.max(0, Math.min(65, this.currentSpeed + Math.floor(Math.random() * 7 - 3)));

      onUpdate({
        officerId,
        latitude: Number(this.currentLatitude.toFixed(6)),
        longitude: Number(this.currentLongitude.toFixed(6)),
        speedKmh: this.currentSpeed,
        speed: this.currentSpeed,
        heading: this.currentHeading,
        batteryLevel: 84,
        source: 'mobile_app',
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        accuracy: Math.floor(3 + Math.random() * 4),
        altitude: Math.floor(45 + Math.random() * 5),
        timestamp: Date.now(),
      });
    }, intervalMs);
  }

  public stopTracking(): void {
    if (this.watcherId) {
      clearInterval(this.watcherId);
      this.watcherId = null;
    }
    this.isTracking = false;
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
