import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

interface OfflineMarkerProps {
  name: string;
  lastPingTime: string;
  isSelected?: boolean;
}

export const OfflineMarker: React.FC<OfflineMarkerProps> = ({
  name,
  lastPingTime,
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
      {/* Last ping callout pill */}
      <View style={[styles.pingTag, elevation.sm, isSelected && styles.pingTagSelected]}>
        <Clock size={10} color={isSelected ? colors.cardSurface : colors.warningAmberDark} style={styles.clockIcon} />
        <Text style={[styles.pingText, isSelected && styles.pingTextSelected]}>
          {lastPingTime}
        </Text>
      </View>

      {/* Amber circle */}
      <View style={[styles.outerRing, isSelected && styles.outerRingSelected]}>
        <View style={styles.innerCircle}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
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
  pingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningAmberLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 4,
  },
  pingTagSelected: {
    backgroundColor: colors.warningAmberDark,
    borderColor: colors.warningAmberDark,
  },
  clockIcon: {
    marginRight: 4,
  },
  pingText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.warningAmberDark,
  },
  pingTextSelected: {
    color: colors.cardSurface,
  },
  outerRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warningAmberLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.warningAmberDark,
  },
  outerRingSelected: {
    borderColor: colors.neutralDark,
  },
  innerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.warningAmberDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: colors.cardSurface,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  pinStem: {
    width: 4,
    height: 6,
    backgroundColor: colors.warningAmberDark,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
