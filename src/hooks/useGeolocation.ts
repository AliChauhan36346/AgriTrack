import { useEffect } from 'react';
import { useTrackingStore } from '../store/trackingStore';
import { useAuthStore } from '../store/authStore';
import { locationService } from '../services/locationService';

/**
 * useGeolocation
 * Automatically tracks GPS breadcrumbs when officer shift is active.
 */
export function useGeolocation() {
  const isShiftActive = useTrackingStore((state) => state.isShiftActive);
  const enqueueBreadcrumb = useTrackingStore((state) => state.enqueueBreadcrumb);
  const currentOfficer = useAuthStore((state) => state.currentOfficer);

  useEffect(() => {
    if (isShiftActive && currentOfficer) {
      locationService.startTracking(currentOfficer.id, (point) => {
        enqueueBreadcrumb(point);
      }, 6000);
    } else {
      locationService.stopTracking();
    }

    return () => {
      locationService.stopTracking();
    };
  }, [isShiftActive, currentOfficer, enqueueBreadcrumb]);

  return {
    isTracking: isShiftActive,
  };
}
