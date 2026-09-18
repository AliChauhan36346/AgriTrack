import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Map, PlayCircle, Cpu, User, LogOut, RefreshCw } from 'lucide-react-native';
import { OwnerLiveMapScreen } from '../screens/owner/OwnerLiveMapScreen';
import { RoutePlaybackScreen } from '../screens/owner/RoutePlaybackScreen';
import { LinkTrackerScreen } from '../screens/owner/LinkTrackerScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type OwnerTabKey = 'live_map' | 'playback' | 'trackers' | 'admin';

export const OwnerTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OwnerTabKey>('live_map');
  const [playbackOfficerId, setPlaybackOfficerId] = useState<string>('off-01');

  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);
  const logout = useAuthStore((state) => state.logout);

  const handleNavigateToPlayback = (officerId: string) => {
    setPlaybackOfficerId(officerId);
    setActiveTab('playback');
  };

  return (
    <View style={styles.container}>
      {/* Active Tab Screen Area */}
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
        {activeTab === 'trackers' && <LinkTrackerScreen />}
        {activeTab === 'admin' && (
          <SafeAreaView style={styles.adminScreen}>
            <View style={styles.adminCard}>
              <View style={styles.adminAvatarCircle}>
                <Text style={styles.adminAvatarText}>AK</Text>
              </View>
              <Text style={styles.adminTitle}>Anand Krishi Kendra</Text>
              <Text style={styles.adminSubtitle}>Distributor Admin • 4 Field Units</Text>

              <View style={styles.roleSwitchSection}>
                <Text style={styles.roleSwitchTitle}>Quick Developer / Testing Switch:</Text>
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setSelectedRole('officer')}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.switchButtonText}>Switch to Field Officer View</Text>
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

      {/* Bottom Tab Bar */}
      <SafeAreaView style={styles.tabBarSafeArea}>
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
              Trackers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('admin')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'admin' }}
          >
            <User
              size={22}
              color={activeTab === 'admin' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'admin' && styles.tabLabelActive,
              ]}
            >
              Admin
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
  adminScreen: {
    flex: 1,
    padding: 20,
  },
  adminCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  adminAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminAvatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
  },
  adminTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  adminSubtitle: {
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
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  switchButtonText: {
    color: colors.primary,
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
