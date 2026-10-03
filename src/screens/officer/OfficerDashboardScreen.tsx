import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Store,
  FileBarChart2,
  Wifi,
  WifiOff,
  Navigation,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Moon,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useTrackingStore } from '../../store/trackingStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SyncBanner } from '../../components/feedback/SyncBanner';
import { BatteryIndicator } from '../../components/feedback/BatteryIndicator';
import { MetricCounter } from '../../components/ui/MetricCounter';
import { ActionCard } from '../../components/ui/ActionCard';
import { Card } from '../../components/ui/Card';
import { VisitLogModal } from './VisitLogModal';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

// Haversine formula to compute distance in km between two GPS coordinates
function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const OfficerDashboardScreen: React.FC = () => {
  // Hook activates background GPS watcher when shift is active
  useGeolocation();

  const currentOfficer = useAuthStore((state) => state.currentOfficer);
  const updateOfficerLocationAndDistance = useAuthStore((state) => state.updateOfficerLocationAndDistance);

  const isShiftActive = useTrackingStore((state) => state.isShiftActive);
  const startShift = useTrackingStore((state) => state.startShift);
  const endShift = useTrackingStore((state) => state.endShift);
  const unsyncedCount = useTrackingStore((state) => state.unsyncedCount);
  const refreshUnsyncedCount = useTrackingStore((state) => state.refreshUnsyncedCount);
  const enqueueBreadcrumb = useTrackingStore((state) => state.enqueueBreadcrumb);
  const visitsCount = useTrackingStore((state) => state.visitsCount);
  const batteryLevel = useTrackingStore((state) => state.batteryLevel);
  const isCharging = useTrackingStore((state) => state.isCharging);
  const currentBreadcrumb = useTrackingStore((state) => state.currentBreadcrumb);
  const isSimulatedOffline = useTrackingStore((state) => state.isSimulatedOffline);
  const toggleSimulatedOffline = useTrackingStore((state) => state.toggleSimulatedOffline);

  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [accumulatedDistance, setAccumulatedDistance] = useState(currentOfficer?.todayDistanceKm || 0);

  const lastCoordRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Helper: check if device time falls within scheduled working hours
  const isWithinWorkingHours = (startTimeStr?: string, endTimeStr?: string) => {
    if (!startTimeStr || !endTimeStr) return true; // Default active if unconfigured
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight shift
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  // Automated shift state evaluator
  useEffect(() => {
    const evaluateShiftSchedule = async () => {
      const scheduledActive = isWithinWorkingHours(
        currentOfficer?.shiftStartTime,
        currentOfficer?.shiftEndTime
      );

      if (scheduledActive && !isShiftActive) {
        // Automatically start shift and tracking without manual button
        await startShift(currentOfficer?.id);
      } else if (!scheduledActive && isShiftActive) {
        // Automatically end shift outside working hours
        await endShift();
      }
    };

    evaluateShiftSchedule();
    const interval = setInterval(evaluateShiftSchedule, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, [currentOfficer?.shiftStartTime, currentOfficer?.shiftEndTime, isShiftActive, currentOfficer?.id]);

  // Real GPS Location Subscription during active shift
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const setupLiveGps = async () => {
      if (!isShiftActive) {
        if (locationSubscription) {
          locationSubscription.remove();
        }
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 6000,
            distanceInterval: 12,
          },
          async (loc) => {
            const { latitude, longitude, speed, heading } = loc.coords;
            const speedKmh = Math.max(0, Math.round((speed || 0) * 3.6));

            let distanceDeltaKm = 0;
            if (lastCoordRef.current) {
              const d = computeDistanceKm(
                lastCoordRef.current.latitude,
                lastCoordRef.current.longitude,
                latitude,
                longitude
              );
              // Filter out GPS drift (only count movements between 10m and 3km)
              if (d >= 0.01 && d <= 3.0) {
                distanceDeltaKm = Number(d.toFixed(2));
              }
            }
            lastCoordRef.current = { latitude, longitude };

            if (distanceDeltaKm > 0) {
              setAccumulatedDistance((prev) => Number((prev + distanceDeltaKm).toFixed(2)));
            }

            // Update AuthStore so Shop Owner's Live Fleet page reflects updates immediately
            if (currentOfficer?.id) {
              await updateOfficerLocationAndDistance(
                currentOfficer.id,
                { latitude, longitude, speed: speedKmh, heading: heading || 0 },
                distanceDeltaKm
              );
            }

            // Enqueue breadcrumb point in SQLite database
            await enqueueBreadcrumb({
              officerId: currentOfficer?.id || 'off-01',
              latitude,
              longitude,
              speedKmh,
              batteryLevel,
              source: 'mobile_app',
              recordedAt: new Date().toISOString(),
            });
          }
        );
      } catch (err) {
        console.warn('[OfficerDashboard] GPS Watcher error:', err);
      }
    };

    setupLiveGps();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isShiftActive, currentOfficer?.id, batteryLevel]);

  // Refresh SQLite unsynced count on screen load
  useEffect(() => {
    refreshUnsyncedCount();
  }, [refreshUnsyncedCount]);

  const officerName = currentOfficer?.fullName || currentOfficer?.name || 'Field Officer';
  const officerTerritory = currentOfficer?.assignedTerritory || 'Assigned Territory';
  const workingHours = currentOfficer?.workingHoursDisplay || '09:00 AM - 06:00 PM';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row with Officer Profile and StatusBadge */}
        <View style={styles.header}>
          <View style={styles.profileColumn}>
            <Text style={styles.greetingText}>خوش آمدید (Welcome),</Text>
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

        {/* Automated Shift Status Card (Shift times set by Shop Owner) */}
        <Card
          style={[
            styles.shiftCard,
            elevation.md,
            isShiftActive ? styles.shiftCardActive : styles.shiftCardInactive,
          ]}
        >
          <View style={styles.shiftHeaderRow}>
            <View style={styles.shiftStatusIndicator}>
              <View
                style={[
                  styles.shiftPulseCircle,
                  { backgroundColor: isShiftActive ? '#DCFCE7' : '#F1F5F9' },
                ]}
              >
                {isShiftActive ? (
                  <CheckCircle2 size={24} color={colors.primary} />
                ) : (
                  <Moon size={24} color="#64748B" />
                )}
              </View>

              <View style={styles.shiftTextWrapper}>
                <View style={styles.shiftTitleRow}>
                  <Text style={styles.shiftStatusTitle}>
                    {isShiftActive
                      ? '🟢 ڈیوٹی جاری ہے (Shift Active)'
                      : '🌙 ڈیوٹی کا وقت ختم ہے (Off Duty)'}
                  </Text>
                </View>

                <View style={styles.scheduleBadge}>
                  <Clock size={12} color={isShiftActive ? colors.primary : '#64748B'} />
                  <Text style={[styles.scheduleBadgeText, !isShiftActive && { color: '#64748B' }]}>
                    مقررہ اوقات: {workingHours}
                  </Text>
                </View>

                <Text style={styles.shiftStatusSubtitle}>
                  {isShiftActive
                    ? 'خودکار GPS لوکیشن اور طے شدہ فاصلہ لائیو ریکارڈ ہو رہا ہے۔'
                    : 'آفیسر کی پرائیویسی کے لیے لوکیشن ٹریکنگ بند ہے۔ مقررہ وقت پر دوبارہ خودکار فعال ہو گی۔'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.autoScheduleNote}>
            <ShieldCheck size={14} color={isShiftActive ? colors.primary : '#64748B'} />
            <Text style={[styles.autoScheduleNoteText, !isShiftActive && { color: '#64748B' }]}>
              {isShiftActive
                ? 'دکان مالک کے شیڈول کے مطابق خودکار ٹریکنگ فعال ہے'
                : 'شفت اوقات دکان مالک کے ذریعے مقرر کیے گئے ہیں'}
            </Text>
          </View>
        </Card>

        {/* 3-Column MetricCounter Row */}
        <Text style={styles.sectionHeading}>Today’s Shift Metrics (آج کی کارکردگی)</Text>
        <View style={styles.metricsRow}>
          <MetricCounter
            title="طے شدہ فاصلہ"
            value={accumulatedDistance}
            unit="km"
            variant="primary"
            icon={<Navigation size={14} color={colors.primary} />}
            style={styles.metricItem}
          />
          <MetricCounter
            title="مکمل وزٹس"
            value={visitsCount}
            unit="Shops"
            variant="default"
            icon={<Store size={14} color={colors.neutralMuted} />}
            style={styles.metricItem}
          />
          <MetricCounter
            title="لوکل کیو"
            value={unsyncedCount}
            unit="Pings"
            variant={unsyncedCount > 0 ? 'warning' : 'default'}
            icon={<Clock size={14} color={unsyncedCount > 0 ? colors.warningAmber : colors.neutralMuted} />}
            style={styles.metricItem}
          />
        </View>

        {/* Quick Action Grid with Reusable ActionCard Components */}
        <Text style={styles.sectionHeading}>Quick Field Actions (فیلڈ کے کام)</Text>

        <ActionCard
          title="ڈیلر شاپ چیک اِن (Check-in at Dealer)"
          subtitle="دکان کا معائنہ، کھاد و بیج کا آرڈر اور نوٹ درج کریں"
          icon={<Store size={22} color={colors.primary} />}
          highlightColor={colors.primary}
          onPress={() => setIsCheckInModalVisible(true)}
        />

        <ActionCard
          title="روزانہ کی خلاصہ رپورٹ (Daily Summary)"
          subtitle={`${visitsCount} وزٹس مکمل • ${accumulatedDistance} km فاصلہ طے کیا`}
          icon={<FileBarChart2 size={22} color={colors.accentBlue} />}
          highlightColor={colors.accentBlue}
          onPress={() => {
            Alert.alert(
              'Daily Summary (روزانہ کی کارکردگی)',
              `• کل طے شدہ فاصلہ: ${accumulatedDistance} km\n• مکمل وزٹس: ${visitsCount} ڈیلرز\n• ڈیوٹی کے اوقات: ${workingHours}\n• کیو میں موجود پنگز: ${unsyncedCount === 0 ? 'سب سنک ہو چکے ہیں' : `${unsyncedCount} پنگز محفوظ ہیں`}`
            );
          }}
        />

        {/* Offline / Online Network Connectivity Toggle */}
        <ActionCard
          title={isSimulatedOffline ? 'Offline Shift Mode (آف لائن موڈ)' : 'Online Connected (آن لائن موڈ)'}
          subtitle={
            isSimulatedOffline
              ? 'مقامی سٹوریج میں محفوظ ہو رہا ہے۔ کلاؤڈ کنکشن کے لیے ٹیپ کریں'
              : 'لائیو کلاؤڈ سے منسلک ہے۔ دیہی علاقوں کے لیے آف لائن موڈ میں بدلیں'
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
            <Text style={styles.telemetryTitle}>Live Geolocation Telemetry (لائیو GPS)</Text>
          </View>
          <Text style={styles.telemetryData}>
            Lat: {currentBreadcrumb?.latitude.toFixed(5) ?? '30.19840'} • Lng:{' '}
            {currentBreadcrumb?.longitude.toFixed(5) ?? '71.46870'} • Speed:{' '}
            {currentBreadcrumb?.speedKmh ?? 0} km/h • فاصلہ: {accumulatedDistance} km
          </Text>
        </Card>
      </ScrollView>

      {/* Dealer Visit Log Modal */}
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  profileColumn: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralMuted,
  },
  officerName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginTop: 2,
  },
  territoryText: {
    fontSize: typography.fontSizes.sm,
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
    marginBottom: spacing.md,
  },

  // Automated Shift Status Card
  shiftCard: {
    padding: 16,
    borderRadius: spacing.cardRadiusLg,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  shiftCardActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  shiftCardInactive: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  shiftHeaderRow: {
    marginBottom: 12,
  },
  shiftStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shiftPulseCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shiftTextWrapper: {
    flex: 1,
  },
  shiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftStatusTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  scheduleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  shiftStatusSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    lineHeight: 18,
  },
  autoScheduleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  autoScheduleNoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 5,
  },

  sectionHeading: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  telemetryCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
  },
  telemetryData: {
    fontSize: typography.fontSizes.xs - 1,
    color: colors.neutralDark,
    lineHeight: 18,
  },
});
