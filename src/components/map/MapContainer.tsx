import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle, Line } from 'react-native-svg';
import { Compass, Layers, Plus, Minus } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MapContainerProps {
  children?: React.ReactNode;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  activeMarkerPosition?: { latitude: number; longitude: number };
  style?: StyleProp<ViewStyle>;
  height?: number;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  children,
  routeCoordinates,
  activeMarkerPosition,
  style,
  height = 420,
}) => {
  // Map coordinate bounds to calculate SVG polyline path
  const svgPath = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length < 2) return '';

    const lats = routeCoordinates.map((c) => c.latitude);
    const lngs = routeCoordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat || 0.05;
    const lngSpan = maxLng - minLng || 0.05;

    // Convert coordinates to 0..100% SVG viewbox coordinates with padding
    const padding = 20;
    const drawWidth = SCREEN_WIDTH - padding * 2;
    const drawHeight = height - padding * 2;

    const points = routeCoordinates.map((c) => {
      const x = padding + ((c.longitude - minLng) / lngSpan) * drawWidth;
      const y = height - (padding + ((c.latitude - minLat) / latSpan) * drawHeight);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }, [routeCoordinates, height]);

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Visual Stylized Cartographic Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height={height} viewBox={`0 0 ${SCREEN_WIDTH} ${height}`}>
          <Defs>
            <LinearGradient id="fieldGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#EBF4EC" stopOpacity="1" />
              <Stop offset="100%" stopColor="#E2EBE3" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.accentBlue} />
              <Stop offset="100%" stopColor="#1D4ED8" />
            </LinearGradient>
          </Defs>

          {/* Land / field base */}
          <Rect width={SCREEN_WIDTH} height={height} fill="url(#fieldGrad)" />

          {/* Rural Agricultural Parcel Grid Lines */}
          <Line x1="0" y1="90" x2={SCREEN_WIDTH} y2="90" stroke="#D3DFD5" strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="0" y1="210" x2={SCREEN_WIDTH} y2="210" stroke="#D3DFD5" strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="0" y1="330" x2={SCREEN_WIDTH} y2="330" stroke="#D3DFD5" strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="110" y1="0" x2="110" y2={height} stroke="#D3DFD5" strokeWidth="1" strokeDasharray="4,4" />
          <Line x1="240" y1="0" x2="240" y2={height} stroke="#D3DFD5" strokeWidth="1" strokeDasharray="4,4" />

          {/* Stylized Rural Canal / Waterway */}
          <Path
            d={`M -20 ${height * 0.75} Q ${SCREEN_WIDTH * 0.4} ${height * 0.6}, ${SCREEN_WIDTH + 20} ${height * 0.85}`}
            stroke="#BFDBFE"
            strokeWidth="12"
            fill="none"
            opacity={0.6}
          />

          {/* Rural Road Network Line */}
          <Path
            d={`M 10 30 Q ${SCREEN_WIDTH * 0.5} 80, ${SCREEN_WIDTH - 20} 380`}
            stroke="#CBD5E1"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Actual Route Polyline if present */}
          {svgPath ? (
            <>
              {/* Route Glow / Shadow */}
              <Path
                d={svgPath}
                stroke="#93C5FD"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.5}
              />
              {/* Main Accent Blue Polyline */}
              <Path
                d={svgPath}
                stroke="url(#routeGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : null}
        </Svg>
      </View>

      {/* Floating Map Controls (Compass, Layer, Zoom) */}
      <View style={styles.topRightControls}>
        <View style={[styles.controlButton, elevation.sm]}>
          <Compass size={18} color={colors.primary} />
        </View>
        <View style={[styles.controlButton, elevation.sm, { marginTop: 8 }]}>
          <Layers size={18} color={colors.neutralDark} />
        </View>
      </View>

      <View style={styles.bottomRightControls}>
        <View style={[styles.controlButton, elevation.sm]}>
          <Plus size={18} color={colors.neutralDark} />
        </View>
        <View style={[styles.controlButton, elevation.sm, { marginTop: 6 }]}>
          <Minus size={18} color={colors.neutralDark} />
        </View>
      </View>

      {/* Live Map Attribution watermark */}
      <View style={styles.attributionBadge}>
        <Text style={styles.attributionText}>Google Maps API • Offline Cached</Text>
      </View>

      {/* Embedded Markers / Pins / Children */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#EBF4EC',
    position: 'relative',
    overflow: 'hidden',
  },
  topRightControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  bottomRightControls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 10,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 5,
  },
  attributionText: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.neutralMuted,
    fontWeight: typography.fontWeights.medium,
  },
});
