import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface BatteryIndicatorProps {
  level: number; // 0 to 100
  isCharging?: boolean;
  showText?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  level,
  isCharging = false,
  showText = true,
}) => {
  const getBatteryColor = () => {
    if (level <= 20) return colors.dangerRed;
    if (level <= 50) return colors.warningAmber;
    return colors.successGreen;
  };

  const iconColor = getBatteryColor();

  return (
    <View style={styles.container}>
      {isCharging ? (
        <BatteryCharging size={18} color={colors.accentBlue} />
      ) : level <= 20 ? (
        <BatteryWarning size={18} color={iconColor} />
      ) : (
        <Battery size={18} color={iconColor} />
      )}
      {showText && (
        <Text style={[styles.text, { color: iconColor }]}>
          {level}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginLeft: 4,
  },
});
