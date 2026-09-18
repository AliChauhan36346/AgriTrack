import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  Users,
  ChevronUp,
  ChevronDown,
  Navigation,
  PlayCircle,
  Phone,
  Cpu,
} from 'lucide-react-native';
import { MapFilterType, FieldOfficer } from '../../types';
import { MOCK_OFFICERS } from '../../mockData';
import { useFilterStore } from '../../store/filterStore';
import { MapContainer } from '../../components/map/MapContainer';
import { LiveMarker } from '../../components/map/LiveMarker';
import { OfflineMarker } from '../../components/map/OfflineMarker';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BatteryIndicator } from '../../components/feedback/BatteryIndicator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OwnerLiveMapScreenProps {
  onNavigateToPlayback?: (officerId: string) => void;
}

// Marker positioning helper across map coordinates
const OFFICER_PIN_COORDS: Record<string, { top?: number; left?: number; right?: number; bottom?: number }> = {
  'off-01': { top: 90, left: 60 },
  'off-02': { top: 160, right: 80 },
  'off-03': { bottom: 130, left: 100 },
  'off-04': { top: 70, right: 30 },
};

export const OwnerLiveMapScreen: React.FC<OwnerLiveMapScreenProps> = ({
  onNavigateToPlayback,
}) => {
  const activeFilter = useFilterStore((state) => state.activeFilter);
  const setFilter = useFilterStore((state) => state.setFilter);
  const selectedOfficerId = useFilterStore((state) => state.selectedOfficerId);
  const setSelectedOfficerId = useFilterStore((state) => state.setSelectedOfficerId);
  const isDrawerExpanded = useFilterStore((state) => state.isDrawerExpanded);
  const toggleDrawer = useFilterStore((state) => state.toggleDrawer);

  const filteredOfficers = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return MOCK_OFFICERS.filter(
          (o) => o.currentStatus === 'active' || o.currentStatus === 'stationary'
        );
      case 'offline':
        return MOCK_OFFICERS.filter((o) => o.currentStatus === 'offline');
      case 'all':
      default:
        return MOCK_OFFICERS;
    }
  }, [activeFilter]);

  const selectedOfficer = useMemo(() => {
    return MOCK_OFFICERS.find((o) => o.id === selectedOfficerId) ?? MOCK_OFFICERS[0];
  }, [selectedOfficerId]);

  const filterTabs: Array<{ id: MapFilterType; label: string; count: number }> = [
    { id: 'all', label: 'All Fleet', count: MOCK_OFFICERS.length },
    {
      id: 'active',
      label: 'Active',
      count: MOCK_OFFICERS.filter(
        (o) => o.currentStatus === 'active' || o.currentStatus === 'stationary'
      ).length,
    },
    {
      id: 'offline',
      label: 'Offline',
      count: MOCK_OFFICERS.filter((o) => o.currentStatus === 'offline').length,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <View style={styles.container}>
        {/* Fullscreen Map Area Rendering MOCK_OFFICERS Markers */}
        <MapContainer height={SCREEN_HEIGHT * 0.58}>
          {filteredOfficers.map((officer) => {
            const isSelected = selectedOfficerId === officer.id;
            const pos = OFFICER_PIN_COORDS[officer.id] ?? { top: 120, left: 120 };

            return (
              <View key={officer.id} style={[styles.markerWrapper, pos]}>
                <TouchableOpacity onPress={() => setSelectedOfficerId(officer.id)}>
                  {officer.currentStatus === 'offline' ? (
                    <OfflineMarker
                      name={officer.fullName}
                      lastPingTime={officer.lastSeenAt}
                      isSelected={isSelected}
                    />
                  ) : (
                    <LiveMarker
                      name={officer.fullName}
                      speed={officer.speedKmh}
                      heading={officer.currentLocation.heading ?? 45}
                      isSelected={isSelected}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </MapContainer>

        {/* Floating Filter Pills Bar (Top of Map) */}
        <View style={styles.floatingHeader}>
          <View style={[styles.pillBar, elevation.md]}>
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${tab.label}, ${tab.count} officers`}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                    <Text style={[styles.countText, isActive && styles.countTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom Sheet Drawer for Officer List */}
        <View
          style={[
            styles.bottomDrawer,
            elevation.lg,
            isDrawerExpanded && styles.bottomDrawerExpanded,
          ]}
        >
          {/* Drawer Handle & Header */}
          <TouchableOpacity
            style={styles.drawerHeader}
            onPress={toggleDrawer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isDrawerExpanded ? 'Collapse officer drawer' : 'Expand officer drawer'}
          >
            <View style={styles.dragBar} />
            <View style={styles.drawerTitleRow}>
              <View style={styles.titleWithIcon}>
                <Users size={20} color={colors.primary} />
                <Text style={styles.drawerTitle}>
                  Field Officers ({filteredOfficers.length})
                </Text>
              </View>
              {isDrawerExpanded ? (
                <ChevronDown size={20} color={colors.neutralMuted} />
              ) : (
                <ChevronUp size={20} color={colors.neutralMuted} />
              )}
            </View>
          </TouchableOpacity>

          {/* Officers List with Speed, Territory, Battery, and Status Badge */}
          <ScrollView
            style={styles.officerListScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.officerListContent}
          >
            {filteredOfficers.map((officer) => {
              const isSelected = officer.id === selectedOfficerId;
              return (
                <TouchableOpacity
                  key={officer.id}
                  onPress={() => setSelectedOfficerId(officer.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.officerCard,
                    elevation.sm,
                    isSelected && styles.officerCardSelected,
                  ]}
                >
                  {/* Top line: Full Name, StatusBadge, Battery */}
                  <View style={styles.officerCardHeader}>
                    <View style={styles.officerInfoBlock}>
                      <Text style={styles.officerName}>{officer.fullName}</Text>
                      <Text style={styles.officerTerritory}>{officer.assignedTerritory}</Text>
                    </View>
                    <View style={styles.badgesCol}>
                      <StatusBadge status={officer.currentStatus} size="sm" />
                      <View style={styles.batterySub}>
                        <BatteryIndicator
                          level={officer.batteryLevel}
                          isCharging={officer.isCharging}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Telemetry line: Speed, Distance, Last Seen, Hardware Tracker */}
                  <View style={styles.telemetryRow}>
                    <View style={styles.telemetryPill}>
                      <Navigation size={12} color={colors.accentBlue} />
                      <Text style={styles.telemetryPillText}>
                        {officer.speedKmh > 0 ? `${officer.speedKmh} km/h` : 'Stationary'}
                      </Text>
                    </View>

                    <View style={styles.telemetryPill}>
                      <Text style={styles.telemetryPillText}>
                        Seen: {officer.lastSeenAt}
                      </Text>
                    </View>

                    {officer.hasHardwareTracker && (
                      <View style={[styles.telemetryPill, styles.trackerPill]}>
                        <Cpu size={11} color={colors.primary} />
                        <Text style={[styles.telemetryPillText, styles.trackerPillText]}>
                          OBD GPS
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action row for selected officer */}
                  {isSelected && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.playbackBtn}
                        onPress={() => onNavigateToPlayback?.(officer.id)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Replay officer route history"
                      >
                        <PlayCircle size={16} color={colors.cardSurface} />
                        <Text style={styles.playbackBtnText}>Replay Route History</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => {}}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${officer.fullName}`}
                      >
                        <Phone size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  pillBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.pillRadius,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: spacing.pillRadius,
    minHeight: 38,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterPillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralMuted,
  },
  filterPillTextActive: {
    color: colors.cardSurface,
    fontWeight: typography.fontWeights.bold,
  },
  countBadge: {
    backgroundColor: colors.neutralDivider,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  countTextActive: {
    color: colors.cardSurface,
  },
  markerWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.neutralBorder,
    height: SCREEN_HEIGHT * 0.42,
    zIndex: 30,
  },
  bottomDrawerExpanded: {
    height: SCREEN_HEIGHT * 0.72,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralDivider,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutralLight,
    marginBottom: 8,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginLeft: 8,
  },
  officerListScroll: {
    flex: 1,
  },
  officerListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  officerCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadiusSm,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    marginBottom: 10,
  },
  officerCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F7FCF9',
  },
  officerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  officerInfoBlock: {
    flex: 1,
  },
  officerName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  officerTerritory: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  batterySub: {
    marginTop: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  trackerPill: {
    backgroundColor: colors.primaryLight,
  },
  telemetryPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    fontWeight: typography.fontWeights.medium,
    marginLeft: 4,
  },
  trackerPillText: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
  },
  playbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44, // touch target friendly
    marginRight: 8,
  },
  playbackBtnText: {
    color: colors.cardSurface,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginLeft: 6,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
