import { useState, useEffect, useRef, useMemo } from 'react';
import { BreadcrumbPoint, PlaybackSpeed, OfficerStop } from '../types';

interface UseOfficerRouteProps {
  breadcrumbs: BreadcrumbPoint[];
  stops: OfficerStop[];
}

export function useOfficerRoute({ breadcrumbs, stops }: UseOfficerRouteProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const animationFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPoints = breadcrumbs.length;

  const currentIndex = useMemo(() => {
    if (totalPoints === 0) return 0;
    return Math.min(totalPoints - 1, Math.floor(progress * (totalPoints - 1)));
  }, [progress, totalPoints]);

  const activeBreadcrumb = useMemo(() => {
    return breadcrumbs[currentIndex] ?? null;
  }, [breadcrumbs, currentIndex]);

  const activeStop = useMemo(() => {
    if (!activeBreadcrumb) return null;
    return (
      stops.find((s) => {
        const sLat = s.latitude ?? s.location?.latitude;
        const sLng = s.longitude ?? s.location?.longitude;
        if (sLat === undefined || sLng === undefined) return false;
        const latDiff = Math.abs(sLat - activeBreadcrumb.latitude);
        const lngDiff = Math.abs(sLng - activeBreadcrumb.longitude);
        return latDiff < 0.003 && lngDiff < 0.003;
      }) ?? null
    );
  }, [stops, activeBreadcrumb]);

  // Animation playback ticker
  useEffect(() => {
    if (isPlaying) {
      const stepDuration = 1000 / speed; // millisecond per step
      animationFrameRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1 / (totalPoints > 1 ? totalPoints - 1 : 1);
          if (next >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return next;
        });
      }, stepDuration);
    } else {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, totalPoints]);

  const togglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seekTo = (ratio: number) => {
    setProgress(Math.max(0, Math.min(1, ratio)));
  };

  const toggleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 2 : 1));
  };

  const formattedTime = useMemo(() => {
    if (!activeBreadcrumb) return '08:30 AM';
    if (activeBreadcrumb.recordedAt) return activeBreadcrumb.recordedAt;
    if (activeBreadcrumb.timestamp) {
      const d = new Date(activeBreadcrumb.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '08:30 AM';
  }, [activeBreadcrumb]);

  return {
    isPlaying,
    progress,
    speed,
    currentIndex,
    activeBreadcrumb,
    activeStop,
    formattedTime,
    togglePlay,
    seekTo,
    toggleSpeed,
    setSpeed,
  };
}
