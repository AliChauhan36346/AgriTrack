import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface MetricCounterProps {
  value: string | number;
  unit?: string;
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'warning';
  style?: StyleProp<ViewStyle>;
}

export const MetricCounter: React.FC<MetricCounterProps> = ({
  value,
  unit,
  title,
  icon,
  subtitle,
  variant = 'default',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          cardBg: colors.cardSurface,
          valueColor: colors.primary,
          borderColor: colors.primaryLight,
        };
      case 'warning':
        return {
          cardBg: colors.cardSurface,
          valueColor: colors.warningAmberDark,
          borderColor: colors.warningAmberLight,
        };
      default:
        return {
          cardBg: colors.cardSurface,
          valueColor: colors.neutralDark,
          borderColor: colors.neutralBorder,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <View
      style={[
        styles.card,
        elevation.sm,
        {
          backgroundColor: currentVariant.cardBg,
          borderColor: currentVariant.borderColor,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {icon && <View style={styles.iconSlot}>{icon}</View>}
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[styles.value, { color: currentVariant.valueColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.cardRadiusSm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  iconSlot: {
    marginLeft: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extrabold,
    letterSpacing: typography.letterSpacing.tighter,
  },
  unit: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralLight,
    marginLeft: 3,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    marginTop: 2,
  },
});
