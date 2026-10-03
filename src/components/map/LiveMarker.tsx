import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Navigation, Bike, Zap } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

interface LiveMarkerProps {
  name: string;
  speed: number;
  heading?: number;
  isSelected?: boolean;
}

export const LiveMarker: React.FC<LiveMarkerProps> = ({
  name,
  speed,
  heading = 0,
  isSelected = false,
}) => {
  // Radar wave pulsing animation for live moving vehicles
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  const isMoving = speed > 0;
  const firstName = name.split(' ')[0] || name;

  return (
    <View style={styles.wrapper}>
      {/* Floating Speed / Status Pill Badge */}
      <View
        style={[
          styles.statusPill,
          elevation.sm,
          isSelected && styles.statusPillSelected,
          isMoving ? styles.movingPill : styles.stoppedPill,
        ]}
      >
        <View
          style={[
            styles.statusDot,
            isMoving ? styles.statusDotMoving : styles.statusDotStopped,
          ]}
        />
        <Text
          style={[
            styles.statusPillText,
            isSelected && styles.statusPillTextSelected,
          ]}
          numberOfLines={1}
        >
          {isMoving ? `${speed} km/h` : 'Stopped'}
        </Text>
      </View>

      {/* Pin Body Container */}
      <View style={styles.pinBodyContainer}>
        {/* Pulsing Radar Ring (Active moving indicator) */}
        {isMoving && (
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
        )}

        {/* Selected Highlight Aura */}
        {isSelected && <View style={styles.selectedAura} />}

        {/* Vehicle / Rider Puck with Heading Rotation */}
        <View style={[styles.vehicleDisc, isSelected && styles.vehicleDiscSelected]}>
          {isMoving ? (
            <View
              style={[
                styles.headingWrapper,
                { transform: [{ rotate: `${heading}deg` }] },
              ]}
            >
              <Navigation
                size={16}
                color="#FFFFFF"
                fill="#FFFFFF"
              />
            </View>
          ) : (
            <Bike size={18} color="#FFFFFF" />
          )}

          {/* Heading directional pointer notch when moving */}
          {isMoving && (
            <View
              style={[
                styles.directionalNotch,
                { transform: [{ rotate: `${heading}deg` }] },
              ]}
            >
              <View style={styles.notchTriangle} />
            </View>
          )}
        </View>

        {/* Officer Name Label Tag */}
        <View style={styles.nameTag}>
          <Text style={styles.nameText} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
      </View>

      {/* Ground Anchor Shadow */}
      <View style={styles.groundShadow} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
    zIndex: 10,
  },
  movingPill: {
    borderColor: '#10B981', // Emerald green
  },
  stoppedPill: {
    borderColor: '#F59E0B', // Amber
  },
  statusPillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#22C55E',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotMoving: {
    backgroundColor: '#10B981',
  },
  statusDotStopped: {
    backgroundColor: '#F59E0B',
  },
  statusPillText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: '#0F172A',
  },
  statusPillTextSelected: {
    color: '#FFFFFF',
  },
  pinBodyContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.45)', // Vivid green radar wave
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.8)',
  },
  selectedAura: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  vehicleDisc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A', // Agri Green primary
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 5,
  },
  vehicleDiscSelected: {
    backgroundColor: '#15803D',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  headingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionalNotch: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  notchTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#16A34A',
  },
  nameTag: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    zIndex: 8,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  groundShadow: {
    width: 18,
    height: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    marginTop: 12,
  },
});
