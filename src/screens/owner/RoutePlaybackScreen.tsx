import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Store,
  Clock,
  Calendar,
  Gauge,
  Cpu,
  Smartphone,
  Battery,
} from 'lucide-react-native';
import {
  MOCK_ROUTE_BREADCRUMBS,
  MOCK_STOPS,
  MOCK_OFFICERS,
} from '../../mockData';
import { useOfficerRoute } from '../../hooks/useOfficerRoute';
import { useAuthStore } from '../../store/authStore';
import { MapContainer } from '../../components/map/MapContainer';
import { StopPin } from '../../components/map/StopPin';
import { PlaybackScrubber } from '../../components/ui/PlaybackScrubber';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoutePlaybackScreenProps {
  officerId?: string;
  onBack?: () => void;
}

// Coordinate positioning offsets for MOCK_STOPS on visual map container
const STOP_POSITIONS: Record<string, { top: number; left?: number; right?: number }> = {
  'stop-01': { top: 120, left: 60 },
  'stop-02': { top: 220, right: 60 },
};

export const RoutePlaybackScreen: React.FC<RoutePlaybackScreenProps> = ({
  officerId = 'off-01',
  onBack,
}) => {
  const registeredOfficers = useAuthStore((state) => state.registeredOfficers);
  const officer =
    registeredOfficers.find((o) => o.id === officerId) ??
    MOCK_OFFICERS.find((o) => o.id === officerId) ??
    MOCK_OFFICERS[0];
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const {
    isPlaying,
    progress,
    speed,
    activeBreadcrumb,
    activeStop,
    formattedTime,
    togglePlay,
    seekTo,
    toggleSpeed,
  } = useOfficerRoute({
    breadcrumbs: MOCK_ROUTE_BREADCRUMBS,
    stops: MOCK_STOPS,
  });

  const currentStop = selectedStopId
    ? MOCK_STOPS.find((s) => s.id === selectedStopId)
    : activeStop;

  const lastBreadcrumb = MOCK_ROUTE_BREADCRUMBS[MOCK_ROUTE_BREADCRUMBS.length - 1];
  const firstBreadcrumb = MOCK_ROUTE_BREADCRUMBS[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <View style={styles.container}>
        {/* Top Floating App Bar */}
        <View style={[styles.appBar, elevation.sm]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to live map"
          >
            <ArrowLeft size={22} color={colors.neutralDark} />
          </TouchableOpacity>

          <View style={styles.appBarTitleBlock}>
            <Text style={styles.officerNameText}>{officer.fullName}</Text>
            <View style={styles.appBarMetaRow}>
              <Calendar size={12} color={colors.neutralMuted} style={styles.metaIcon} />
              <Text style={styles.dateMetaText}>
                {officer.assignedTerritory} • {MOCK_ROUTE_BREADCRUMBS.length} GPS Points • {MOCK_STOPS.length} Stops
              </Text>
            </View>
          </View>
        </View>

        {/* Map View with Polyline and Stop Pins from MOCK_STOPS */}
        <MapContainer
          height={SCREEN_HEIGHT * 0.52}
          routeCoordinates={MOCK_ROUTE_BREADCRUMBS}
        >
          {/* Render MOCK_STOPS markers dynamically */}
          {MOCK_STOPS.map((stop) => {
            const pos = STOP_POSITIONS[stop.id] ?? { top: 150, left: 100 };
            const isSelected = currentStop?.id === stop.id;

            return (
              <View key={stop.id} style={[styles.markerWrapper, pos]}>
                <StopPin
                  dealerName={stop.stopName}
                  dwellMinutes={stop.durationMinutes}
                  isSelected={isSelected}
                  onPress={() => setSelectedStopId(stop.id)}
                />
              </View>
            );
          })}

          {/* Real-time moving vehicle dot along the route during playback */}
          {activeBreadcrumb && (
            <View
              style={[
                styles.movingVehicleDot,
                {
                  top: 80 + progress * 240,
                  left: 60 + progress * 220,
                },
              ]}
            >
              <View style={styles.vehicleOuterRing}>
                <View style={styles.vehicleCenter} />
              </View>
              <View style={styles.vehicleSpeedTag}>
                <Text style={styles.vehicleSpeedText}>
                  {activeBreadcrumb.speedKmh} km/h
                </Text>
              </View>
            </View>
          )}
        </MapContainer>

        {/* Bottom Interactive Playback & Inspection Area */}
        <View style={styles.bottomSheetArea}>
          {/* Stop Dwell Details Card or Live Breadcrumb Telemetry Card */}
          {currentStop ? (
            <Card style={styles.stopDetailCard}>
              <View style={styles.stopHeader}>
                <View style={styles.stopTitleRow}>
                  <Store size={18} color={colors.primary} />
                  <Text style={styles.stopDealerTitle} numberOfLines={1}>
                    {currentStop.stopName}
                  </Text>
                </View>
                <View style={styles.dwellBadge}>
                  <Clock size={12} color={colors.warningAmberDark} />
                  <Text style={styles.dwellBadgeText}>{currentStop.durationMinutes} min dwell</Text>
                </View>
              </View>
              <Text style={styles.stopAddress}>
                Arrived: {currentStop.arrivedAt} • Departed: {currentStop.departedAt}
              </Text>
              {currentStop.purpose ? (
                <Text style={styles.stopNotes}>
                  <Text style={styles.boldLabel}>Audit Purpose: </Text>
                  {currentStop.purpose}
                </Text>
              ) : null}
            </Card>
          ) : (
            <Card style={styles.telemetryStatsCard}>
              {/* Telemetry item 1: Speed */}
              <View style={styles.telemetryStatCol}>
                <Text style={styles.telemetryLabel}>Telemetry Speed</Text>
                <View style={styles.telemetryValRow}>
                  <Gauge size={16} color={colors.accentBlue} style={styles.statIcon} />
                  <Text style={styles.telemetryVal}>
                    {activeBreadcrumb?.speedKmh ?? 0}{' '}
                    <Text style={styles.unitText}>km/h</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.dividerCol} />

              {/* Telemetry item 2: Battery */}
              <View style={styles.telemetryStatCol}>
                <Text style={styles.telemetryLabel}>Unit Battery</Text>
                <View style={styles.telemetryValRow}>
                  <Battery size={16} color={colors.primary} style={styles.statIcon} />
                  <Text style={styles.telemetryVal}>
                    {activeBreadcrumb?.batteryLevel ?? 84}%
                  </Text>
                </View>
              </View>

              <View style={styles.dividerCol} />

              {/* Telemetry item 3: Telemetry Source */}
              <View style={styles.telemetryStatCol}>
                <Text style={styles.telemetryLabel}>GPS Source</Text>
                <View style={styles.telemetryValRow}>
                  {activeBreadcrumb?.source === 'hardware_tracker' ? (
                    <Cpu size={15} color={colors.primary} style={styles.statIcon} />
                  ) : (
                    <Smartphone size={15} color={colors.accentBlue} style={styles.statIcon} />
                  )}
                  <Text style={styles.sourceText}>
                    {activeBreadcrumb?.source === 'hardware_tracker' ? 'OBD Tracker' : 'Mobile App'}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Docked Playback Scrubber bound to MOCK_ROUTE_BREADCRUMBS timeline */}
          <PlaybackScrubber
            isPlaying={isPlaying}
            progress={progress}
            currentTime={formattedTime}
            totalTime={lastBreadcrumb.recordedAt}
            speed={speed}
            onTogglePlay={togglePlay}
            onSeek={seekTo}
            onToggleSpeed={toggleSpeed}
            style={styles.scrubberDocked}
          />
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
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  appBarTitleBlock: {
    flex: 1,
  },
  officerNameText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  appBarMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaIcon: {
    marginRight: 4,
  },
  dateMetaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  markerWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  movingVehicleDot: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 15,
  },
  vehicleOuterRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentBlueLight,
    borderWidth: 2,
    borderColor: colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentBlue,
  },
  vehicleSpeedTag: {
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    marginTop: 2,
  },
  vehicleSpeedText: {
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  bottomSheetArea: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 16,
    paddingTop: 12,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  stopDetailCard: {
    padding: 14,
    backgroundColor: colors.cardSurface,
    borderColor: colors.primaryLight,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  stopDealerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginLeft: 6,
  },
  dwellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningAmberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dwellBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.warningAmberDark,
    marginLeft: 4,
  },
  stopAddress: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginBottom: 4,
  },
  stopNotes: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralDark,
  },
  boldLabel: {
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  telemetryStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  telemetryStatCol: {
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.semibold,
    marginBottom: 4,
  },
  telemetryValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  telemetryVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  sourceText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  unitText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.regular,
  },
  dividerCol: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutralBorder,
  },
  scrubberDocked: {
    marginTop: 8,
  },
});
