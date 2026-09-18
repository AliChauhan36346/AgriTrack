import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { OfficerStatus } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface StatusBadgeProps {
  status: OfficerStatus;
  showPulse?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const statusConfig: Record<
  OfficerStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: {
    label: 'Active',
    bg: colors.successGreenLight,
    text: colors.successGreen,
    dot: colors.successGreen,
  },
  online: {
    label: 'Online',
    bg: colors.successGreenLight,
    text: colors.successGreen,
    dot: colors.successGreen,
  },
  offline: {
    label: 'Offline',
    bg: colors.warningAmberLight,
    text: colors.warningAmberDark,
    dot: colors.warningAmber,
  },
  syncing: {
    label: 'Syncing',
    bg: colors.accentBlueLight,
    text: colors.accentBlueDark,
    dot: colors.accentBlue,
  },
  stationary: {
    label: 'Stationary',
    bg: colors.neutralDivider,
    text: colors.neutralMuted,
    dot: colors.neutralLight,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showPulse = true,
  size = 'md',
  style,
}) => {
  const config = statusConfig[status] ?? statusConfig.active;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showPulse && (status === 'active' || status === 'online' || status === 'syncing')) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showPulse, status, pulseAnim]);

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg },
        isSmall ? styles.containerSm : styles.containerMd,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: config.dot, opacity: pulseAnim },
          isSmall ? styles.dotSm : styles.dotMd,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  containerMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    borderRadius: 9999,
    marginRight: 6,
  },
  dotSm: {
    width: 6,
    height: 6,
  },
  dotMd: {
    width: 8,
    height: 8,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: typography.fontSizes.xs,
  },
  textMd: {
    fontSize: typography.fontSizes.sm,
  },
});
