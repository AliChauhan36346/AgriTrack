import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation } from 'lucide-react-native';
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
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.wrapper}>
      {/* Officer speed callout pill */}
      <View style={[styles.speedTag, elevation.sm, isSelected && styles.speedTagSelected]}>
        <Text style={[styles.speedText, isSelected && styles.speedTextSelected]}>
          {speed > 0 ? `${speed} km/h` : 'Stopped'}
        </Text>
      </View>

      {/* Outer pulsing ring for active officer */}
      <View style={[styles.outerRing, isSelected && styles.outerRingSelected]}>
        <View style={styles.innerCircle}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>

        {/* Directional heading needle */}
        {speed > 0 && (
          <View
            style={[
              styles.headingPointer,
              { transform: [{ rotate: `${heading}deg` }] },
            ]}
          >
            <Navigation size={12} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Pin stem */}
      <View style={styles.pinStem} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedTag: {
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    marginBottom: 4,
  },
  speedTagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speedText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  speedTextSelected: {
    color: colors.cardSurface,
  },
  outerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    position: 'relative',
  },
  outerRingSelected: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlueLight,
  },
  innerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: colors.cardSurface,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  headingPointer: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  pinStem: {
    width: 4,
    height: 6,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
