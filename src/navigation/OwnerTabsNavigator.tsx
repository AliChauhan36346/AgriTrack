import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, PlayCircle, Cpu, Users, LogOut, ArrowLeftRight } from 'lucide-react-native';
import { OwnerLiveMapScreen } from '../screens/owner/OwnerLiveMapScreen';
import { RoutePlaybackScreen } from '../screens/owner/RoutePlaybackScreen';
import { LinkTrackerScreen } from '../screens/owner/LinkTrackerScreen';
import { ManageOfficersScreen } from '../screens/owner/ManageOfficersScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export type OwnerTabKey = 'live_map' | 'playback' | 'team' | 'trackers';

export const OwnerTabsNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OwnerTabKey>('live_map');
  const [playbackOfficerId, setPlaybackOfficerId] = useState<string>('off-01');

  const loginAs = useAuthStore((state) => state.loginAs);
  const logout = useAuthStore((state) => state.logout);

  const handleNavigateToPlayback = (officerId: string) => {
    setPlaybackOfficerId(officerId);
    setActiveTab('playback');
  };

  const handleRoleOrLogout = () => {
    Alert.alert(
      'Account & Role Options',
      'Choose an action for AgriRoute portal:',
      [
        {
          text: 'Switch to Field Officer',
          onPress: () => loginAs('officer'),
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
              <Text style={styles.roleBadgeText}>Shop Owner</Text>
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

      {/* Screen Area for the 4 Primary Tabs */}
      <View style={styles.screenArea}>
        {activeTab === 'live_map' && (
          <OwnerLiveMapScreen onNavigateToPlayback={handleNavigateToPlayback} />
        )}
        {activeTab === 'playback' && (
          <RoutePlaybackScreen
            officerId={playbackOfficerId}
            onBack={() => setActiveTab('live_map')}
          />
        )}
        {activeTab === 'team' && <ManageOfficersScreen />}
        {activeTab === 'trackers' && <LinkTrackerScreen />}
      </View>

      {/* Persistent Bottom Tab Bar with Stitch Theme Tokens */}
      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('live_map')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'live_map' }}
          >
            <Map
              size={22}
              color={activeTab === 'live_map' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'live_map' && styles.tabLabelActive,
              ]}
            >
              Live Fleet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('playback')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'playback' }}
          >
            <PlayCircle
              size={22}
              color={activeTab === 'playback' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'playback' && styles.tabLabelActive,
              ]}
            >
              Playback
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('team')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'team' }}
          >
            <Users
              size={22}
              color={activeTab === 'team' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'team' && styles.tabLabelActive,
              ]}
            >
              Team & Codes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('trackers')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'trackers' }}
          >
            <Cpu
              size={22}
              color={activeTab === 'trackers' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'trackers' && styles.tabLabelActive,
              ]}
            >
              Link Tracker
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: colors.accentBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.pillRadius,
  },
  roleBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.accentBlue,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
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
    color: colors.primary,
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
  tabLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.medium,
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
