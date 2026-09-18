import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface ActionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightBadge?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  highlightColor?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  rightBadge,
  onPress,
  disabled = false,
  style,
  highlightColor,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        styles.card,
        elevation.base,
        highlightColor ? { borderLeftColor: highlightColor, borderLeftWidth: 4 } : null,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            highlightColor ? { backgroundColor: `${highlightColor}15` } : null,
          ]}
        >
          {icon}
        </View>
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightContainer}>
        {rightBadge}
        {onPress && (
          <ChevronRight
            size={20}
            color={colors.neutralLight}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: spacing.touchTargetMin + 8, // >= 56dp for great field usability
    marginVertical: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  disabled: {
    opacity: 0.6,
  },
});
