import { useEffect, useState } from 'react';
import { useTrackingStore } from '../store/trackingStore';

/**
 * useNetworkStatus
 * React hook monitoring network connectivity with support for manual simulation toggle.
 */
export function useNetworkStatus() {
  const isSimulatedOffline = useTrackingStore((state) => state.isSimulatedOffline);
  const toggleSimulatedOffline = useTrackingStore((state) => state.toggleSimulatedOffline);
  const [isSystemConnected, setIsSystemConnected] = useState(true);

  // In production, NetInfo.addEventListener subscribes to hardware interface changes
  useEffect(() => {
    // Default online
    setIsSystemConnected(true);
  }, []);

  const isOnline = isSystemConnected && !isSimulatedOffline;

  return {
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
  };
}
