import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LayoutDashboard, Store, User, LogOut } from 'lucide-react-native';
import { OfficerDashboardScreen } from '../screens/officer/OfficerDashboardScreen';
import { VisitLogModal } from '../screens/officer/VisitLogModal';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const OfficerTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checkin' | 'profile'>('dashboard');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);
  const logout = useAuthStore((state) => state.logout);
  const currentOfficer = useAuthStore((state) => state.currentOfficer);

  return (
    <View style={styles.container}>
      {/* Active Tab Screen */}
      <View style={styles.screenArea}>
        {activeTab === 'dashboard' ? (
          <OfficerDashboardScreen />
        ) : (
          <SafeAreaView style={styles.profileScreen}>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>RP</Text>
              </View>
              <Text style={styles.officerName}>{currentOfficer?.name ?? 'Ramesh Patel'}</Text>
              <Text style={styles.officerRole}>{currentOfficer?.roleTitle ?? 'Senior Agronomist'}</Text>
              <Text style={styles.officerTerritory}>
                {currentOfficer?.assignedTerritory ?? 'Vadodara Rural Zone 1'}
              </Text>

              <View style={styles.roleSwitchSection}>
                <Text style={styles.roleSwitchTitle}>Quick Developer / Testing Switch:</Text>
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setSelectedRole('owner')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.switchButtonText}>Switch to Shop Owner View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={logout}
                  activeOpacity={0.8}
                >
                  <LogOut size={16} color={colors.dangerRed} style={{ marginRight: 6 }} />
                  <Text style={styles.logoutButtonText}>Log Out / Change Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <SafeAreaView style={styles.tabBarSafeArea}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'dashboard' }}
          >
            <LayoutDashboard
              size={22}
              color={activeTab === 'dashboard' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'dashboard' && styles.tabLabelActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setIsCheckInOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Check-in at Dealer"
          >
            <View style={styles.fabCenterButton}>
              <Store size={22} color={colors.cardSurface} />
            </View>
            <Text style={styles.tabLabel}>Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'profile' }}
          >
            <User
              size={22}
              color={activeTab === 'profile' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'profile' && styles.tabLabelActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <VisitLogModal visible={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  screenArea: {
    flex: 1,
  },
  tabBarSafeArea: {
    backgroundColor: colors.cardSurface,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: colors.neutralBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.touchTargetMin,
  },
  fabCenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  profileScreen: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  officerName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  officerRole: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
    marginTop: 2,
  },
  officerTerritory: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 4,
  },
  roleSwitchSection: {
    width: '100%',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
    paddingTop: 20,
    alignItems: 'center',
  },
  roleSwitchTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.semibold,
  },
  switchButton: {
    width: '100%',
    backgroundColor: colors.accentBlueLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  switchButtonText: {
    color: colors.accentBlue,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: colors.dangerRed,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
});
