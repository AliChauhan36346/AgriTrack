import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Power,
  Store,
  FileBarChart2,
  Wifi,
  WifiOff,
  Navigation,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useTrackingStore } from '../../store/trackingStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SyncBanner } from '../../components/feedback/SyncBanner';
import { BatteryIndicator } from '../../components/feedback/BatteryIndicator';
import { MetricCounter } from '../../components/ui/MetricCounter';
import { ActionCard } from '../../components/ui/ActionCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VisitLogModal } from './VisitLogModal';
import { MOCK_OFFICERS } from '../../mockData';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export const OfficerDashboardScreen: React.FC = () => {
  // Hook activates background GPS watcher when shift is active
  useGeolocation();

  const currentOfficer = useAuthStore((state) => state.currentOfficer);
  const isShiftActive = useTrackingStore((state) => state.isShiftActive);
  const toggleShift = useTrackingStore((state) => state.toggleShift);
  const distanceKm = useTrackingStore((state) => state.distanceKm);
  const visitsCount = useTrackingStore((state) => state.visitsCount);
  const offlineQueue = useTrackingStore((state) => state.offlineQueue);
  const batteryLevel = useTrackingStore((state) => state.batteryLevel);
  const isCharging = useTrackingStore((state) => state.isCharging);
  const currentBreadcrumb = useTrackingStore((state) => state.currentBreadcrumb);
  const isSimulatedOffline = useTrackingStore((state) => state.isSimulatedOffline);
  const toggleSimulatedOffline = useTrackingStore((state) => state.toggleSimulatedOffline);

  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);

  const defaultOfficer = MOCK_OFFICERS[0];
  const officerName = currentOfficer?.fullName ?? currentOfficer?.name ?? defaultOfficer.fullName;
  const officerTerritory = currentOfficer?.assignedTerritory ?? defaultOfficer.assignedTerritory;

  const handleShiftToggle = () => {
    if (isShiftActive) {
      Alert.alert(
        'End Shift?',
        'This will stop active GPS breadcrumb recording for today.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Shift',
            style: 'destructive',
            onPress: () => toggleShift(),
          },
        ]
      );
    } else {
      toggleShift();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row with Officer Profile and StatusBadge */}
        <View style={styles.header}>
          <View style={styles.profileColumn}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.officerName}>{officerName}</Text>
            <Text style={styles.territoryText}>{officerTerritory}</Text>
          </View>

          <View style={styles.headerRightColumn}>
            <StatusBadge status={isShiftActive ? 'active' : 'stationary'} />
            <View style={styles.batteryWrapper}>
              <BatteryIndicator level={batteryLevel} isCharging={isCharging} />
            </View>
          </View>
        </View>

        {/* Global Sync Banner */}
        <SyncBanner style={styles.syncBanner} />

        {/* Primary Shift Control Card */}
        <Card style={[styles.shiftCard, isShiftActive ? styles.shiftCardActive : styles.shiftCardInactive]}>
          <View style={styles.shiftHeaderRow}>
            <View style={styles.shiftStatusIndicator}>
              <View
                style={[
                  styles.shiftPulseCircle,
                  { backgroundColor: isShiftActive ? colors.primaryLight : colors.neutralDivider },
                ]}
              >
                <Power
                  size={20}
                  color={isShiftActive ? colors.primary : colors.neutralMuted}
                />
              </View>
              <View style={styles.shiftTextWrapper}>
                <Text style={styles.shiftStatusTitle}>
                  {isShiftActive ? 'Shift Active • Tracking Enabled' : 'Shift Ended • Tracking Paused'}
                </Text>
                <Text style={styles.shiftStatusSubtitle}>
                  {isShiftActive
                    ? 'Capturing GPS pings every 10s'
                    : 'Press button below to begin route tracking'}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title={isShiftActive ? 'End Today’s Shift' : 'Start Today’s Shift'}
            variant={isShiftActive ? 'danger' : 'primary'}
            size="lg"
            onPress={handleShiftToggle}
            icon={<Power size={20} color={colors.cardSurface} />}
            style={styles.shiftButton}
          />
        </Card>

        {/* 3-Column MetricCounter Row */}
        <Text style={styles.sectionHeading}>Today’s Shift Metrics</Text>
        <View style={styles.metricsRow}>
          <MetricCounter
            title="Distance"
            value={distanceKm}
            unit="km"
            variant="primary"
            icon={<Navigation size={14} color={colors.primary} />}
            style={styles.metricItem}
          />
          <MetricCounter
            title="Visits"
            value={visitsCount}
            unit="Shops"
            variant="default"
            icon={<Store size={14} color={colors.neutralMuted} />}
            style={styles.metricItem}
          />
          <MetricCounter
            title="Local Queue"
            value={offlineQueue.length}
            unit="Pings"
            variant={offlineQueue.length > 0 ? 'warning' : 'default'}
            icon={<Clock size={14} color={offlineQueue.length > 0 ? colors.warningAmber : colors.neutralMuted} />}
            style={styles.metricItem}
          />
        </View>

        {/* Quick Action Grid with Reusable ActionCard Components */}
        <Text style={styles.sectionHeading}>Quick Field Actions</Text>

        <ActionCard
          title="Check-in at Dealer"
          subtitle="Log shop visit, inventory audit, and order notes"
          icon={<Store size={22} color={colors.primary} />}
          highlightColor={colors.primary}
          onPress={() => setIsCheckInModalVisible(true)}
        />

        <ActionCard
          title="Daily Summary & Visits"
          subtitle={`${visitsCount} logged visits across ${distanceKm} km traveled`}
          icon={<FileBarChart2 size={22} color={colors.accentBlue} />}
          highlightColor={colors.accentBlue}
          onPress={() => {
            Alert.alert(
              'Daily Summary',
              `• Distance: ${distanceKm} km\n• Completed Visits: ${visitsCount} dealers\n• Breadcrumbs Recorded: 84 points\n• Synced to Cloud: ${offlineQueue.length === 0 ? '100%' : `${offlineQueue.length} queued`}`
            );
          }}
        />

        {/* Network Diagnostics Toggle (Demonstrating Offline Queueing) */}
        <ActionCard
          title={isSimulatedOffline ? 'Offline Mode Active' : 'Online Mode Active'}
          subtitle={
            isSimulatedOffline
              ? 'Tap to reconnect and auto-sync queued breadcrumbs'
              : 'Tap to test offline queueing and rural mode'
          }
          icon={
            isSimulatedOffline ? (
              <WifiOff size={22} color={colors.warningAmberDark} />
            ) : (
              <Wifi size={22} color={colors.successGreen} />
            )
          }
          highlightColor={isSimulatedOffline ? colors.warningAmberDark : colors.successGreen}
          onPress={toggleSimulatedOffline}
        />

        {/* Live GPS Telemetry Strip */}
        <Card style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.telemetryTitle}>Live Geolocation Telemetry</Text>
          </View>
          <Text style={styles.telemetryData}>
            Lat: {currentBreadcrumb?.latitude.toFixed(5) ?? '22.30720'} • Lng:{' '}
            {currentBreadcrumb?.longitude.toFixed(5) ?? '73.18120'} • Speed:{' '}
            {currentBreadcrumb?.speed ?? 0} km/h • Heading: {currentBreadcrumb?.heading ?? 0}°
          </Text>
        </Card>
      </ScrollView>

      {/* Check-in Modal */}
      <VisitLogModal
        visible={isCheckInModalVisible}
        onClose={() => setIsCheckInModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileColumn: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
    fontWeight: typography.fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  officerName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.neutralDark,
  },
  territoryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  headerRightColumn: {
    alignItems: 'flex-end',
  },
  batteryWrapper: {
    marginTop: 6,
  },
  syncBanner: {
    marginBottom: 12,
  },
  shiftCard: {
    padding: 16,
    borderRadius: spacing.cardRadius,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  shiftCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F7FCF9',
  },
  shiftCardInactive: {
    borderColor: colors.neutralBorder,
    backgroundColor: colors.cardSurface,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shiftStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftPulseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftTextWrapper: {
    flex: 1,
  },
  shiftStatusTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  shiftStatusSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  shiftButton: {
    minHeight: 52, // >= 48dp
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    marginHorizontal: 4,
  },
  telemetryCard: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderColor: colors.neutralBorder,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  telemetryTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  telemetryData: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    fontFamily: 'monospace',
  },
});
