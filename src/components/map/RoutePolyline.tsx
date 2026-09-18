import React from 'react';
import { Breadcrumb } from '../../types';
import { colors } from '../../theme/colors';

export interface RoutePolylineProps {
  coordinates: Array<{ latitude: number; longitude: number }> | Breadcrumb[];
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * RoutePolyline
 * Provides coordinate declarations and stroke styling conforming to Accent Blue (#2563EB).
 */
export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  coordinates,
  strokeColor = colors.accentBlue,
  strokeWidth = 4,
}) => {
  // In native Google Maps (react-native-maps), this delegates to Polyline component
  // In our universal MapContainer, coordinates are projected to high-performance SVG path.
  return null;
};
