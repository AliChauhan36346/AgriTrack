import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

interface StopPinProps {
  dealerName: string;
  dwellMinutes: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const StopPin: React.FC<StopPinProps> = ({
  dealerName,
  dwellMinutes,
  isSelected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`Stop at ${dealerName}, dwell time ${dwellMinutes} minutes`}
    >
      {/* Callout speech bubble */}
      <View
        style={[
          styles.callout,
          elevation.md,
          isSelected && styles.calloutSelected,
        ]}
      >
        <Text style={[styles.dealerTitle, isSelected && styles.textSelected]} numberOfLines={1}>
          {dealerName}
        </Text>
        <View style={styles.dwellRow}>
          <Clock
            size={11}
            color={isSelected ? colors.cardSurface : colors.warningAmberDark}
            style={styles.clockIcon}
          />
          <Text style={[styles.dwellText, isSelected && styles.textSelected]}>
            Stopped: {dwellMinutes} min
          </Text>
        </View>
      </View>

      {/* Triangle pointer under callout */}
      <View
        style={[
          styles.calloutPointer,
          isSelected && styles.calloutPointerSelected,
        ]}
      />

      {/* Pin Icon with target base */}
      <View style={[styles.pinCircle, isSelected && styles.pinCircleSelected]}>
        <MapPin
          size={18}
          color={isSelected ? colors.cardSurface : colors.dangerRed}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: colors.cardSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    alignItems: 'center',
    minWidth: 130,
  },
  calloutSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  dealerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  dwellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  clockIcon: {
    marginRight: 4,
  },
  dwellText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semibold,
    color: colors.warningAmberDark,
  },
  textSelected: {
    color: colors.cardSurface,
  },
  calloutPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.cardSurface,
    alignSelf: 'center',
    marginBottom: 2,
  },
  calloutPointerSelected: {
    borderTopColor: colors.primary,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dangerRedLight,
    borderWidth: 2,
    borderColor: colors.dangerRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
});
