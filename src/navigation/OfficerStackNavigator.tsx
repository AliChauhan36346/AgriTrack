import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftRight, LogOut } from 'lucide-react-native';
import { OfficerDashboardScreen } from '../screens/officer/OfficerDashboardScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const OfficerStackNavigator: React.FC = () => {
  const currentOfficerName = useAuthStore((state) => state.currentOfficerName);
  const loginAs = useAuthStore((state) => state.loginAs);
  const logout = useAuthStore((state) => state.logout);

  const handleRoleOrLogout = () => {
    Alert.alert(
      'Account & Role Options',
      'Choose an action for AgriRoute portal:',
      [
        {
          text: 'Switch to Shop Owner',
          onPress: () => loginAs('owner'),
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Quick "Switch Role / Logout" Button */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top', 'left', 'right']}>
        <View style={styles.headerBar}>
          <View style={styles.headerBrand}>
            <Text style={styles.brandTitle}>AgriRoute</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Field Officer</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleRoleOrLogout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Switch Role or Logout"
            >
              <ArrowLeftRight size={14} color={colors.primary} style={styles.switchIcon} />
              <Text style={styles.switchButtonText}>Switch / Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutIconButton}
              onPress={logout}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Quick Logout"
            >
              <LogOut size={16} color={colors.dangerRed} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Main Screen */}
      <View style={styles.screenArea}>
        <OfficerDashboardScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  headerSafeArea: {
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.cardSurface,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    letterSpacing: -0.3,
  },
  roleBadge: {
    marginLeft: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.pillRadius,
  },
  roleBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlueLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.pillRadius,
    marginRight: 8,
  },
  switchIcon: {
    marginRight: 4,
  },
  switchButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
  },
  logoutIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dangerRedLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenArea: {
    flex: 1,
  },
});
