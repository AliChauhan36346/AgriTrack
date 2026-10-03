import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  QrCode,
  Cpu,
  UserCheck,
  ChevronDown,
  Sparkles,
  Zap,
  Smartphone,
  Radio,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { HardwareTracker } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { BatteryIndicator } from '../../components/feedback/BatteryIndicator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

export const LinkTrackerScreen: React.FC = () => {
  const currentOwner = useAuthStore((state) => state.currentOwner);
  const registeredOfficers = useAuthStore((state) => state.registeredOfficers);

  const ownerOfficers = React.useMemo(() => {
    if (!currentOwner) return registeredOfficers.filter((o) => !o.id.startsWith('off-0'));
    return registeredOfficers.filter((o) => o.ownerId === currentOwner.id);
  }, [registeredOfficers, currentOwner]);

  // Initialized empty (all mock trackers removed)
  const [trackers, setTrackers] = useState<HardwareTracker[]>([]);
  const [imeiInput, setImeiInput] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    ownerOfficers[0]?.id || ''
  );
  const [isOfficerPickerOpen, setIsOfficerPickerOpen] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [imeiError, setImeiError] = useState<string | null>(null);

  const selectedOfficer = ownerOfficers.find((o) => o.id === selectedOfficerId) || ownerOfficers[0];

  const handleSimulatedScan = () => {
    const sampleImei = `86420904${Math.floor(1000000 + Math.random() * 9000000)}`;
    setImeiInput(sampleImei);
    setImeiError(null);
  };

  const handlePairTracker = async () => {
    const cleaned = imeiInput.replace(/\s+/g, '');
    if (cleaned.length !== 15) {
      setImeiError('IMEI must be exactly 15 numeric digits (15 ہندسے)');
      return;
    }

    if (!selectedOfficer) {
      Alert.alert('آفیسر منتخب کریں', 'براہ کرم ٹریکر لنک کرنے کے لیے پہلے آفیسر منتخب کریں۔');
      return;
    }

    setImeiError(null);
    setIsPairing(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const newTracker: HardwareTracker = {
      id: `trk-${Date.now()}`,
      imei: cleaned,
      model: 'Teltonika FMB920 Agro OBD',
      assignedOfficerId: selectedOfficer.id,
      batteryLevel: 100,
      status: 'active',
      lastSignalTime: 'Just now',
      firmwareVersion: 'v03.28.05',
    };

    setTrackers((prev) => [newTracker, ...prev]);
    setIsPairing(false);
    setImeiInput('');

    Alert.alert(
      'Tracker Linked Successfully',
      `Hardware GPS (IMEI: ${cleaned}) has been linked to ${selectedOfficer.fullName}.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hardware GPS Tracker Linker</Text>
          <Text style={styles.subtitle}>
            گاڑی و موٹر سائیکل کے بیرونی GPS ڈیوائسز اور OBD ٹریکرز کو آفیسرز کے ساتھ لنک کریں۔
          </Text>
        </View>

        {/* Feature Coming Soon Announcement Card */}
        <Card style={[styles.comingSoonCard, elevation.sm]}>
          <View style={styles.comingSoonBadge}>
            <Sparkles size={13} color="#2563EB" />
            <Text style={styles.comingSoonBadgeText}>COMING SOON • اگلی اپڈیٹ</Text>
          </View>
          <Text style={styles.comingSoonTitle}>
            OBD-II & Teltonika GPS Hardware Integration
          </Text>
          <Text style={styles.comingSoonDesc}>
            گاڑیوں کے ہارڈویئر OBD ٹریکر کا کلاؤڈ کنکشن اگلی اپڈیٹ میں لائیو ہو گا۔ اس دوران، AgriRoute ایپ موبائل فون کے ہائی ایکوریسی GPS کے ذریعے فیلڈ آفیسرز کی مکمل شفٹ اور طے شدہ فاصلہ خودکار ٹریک کر رہی ہے۔
          </Text>
          <View style={styles.activeMethodPill}>
            <Smartphone size={13} color={colors.primary} />
            <Text style={styles.activeMethodText}>
              فی الوقت فعال طریقہ: موبائل فون GPS آٹو ٹریکنگ (Active)
            </Text>
          </View>
        </Card>

        {/* Camera Viewport Frame with Barcode/QR Targeting Box */}
        <View style={[styles.viewportCard, elevation.md]}>
          <View style={styles.cameraBackground}>
            <View style={styles.targetFrame}>
              <View style={[styles.cornerMarker, styles.cornerTopLeft]} />
              <View style={[styles.cornerMarker, styles.cornerTopRight]} />
              <View style={[styles.cornerMarker, styles.cornerBottomLeft]} />
              <View style={[styles.cornerMarker, styles.cornerBottomRight]} />
              <View style={styles.laserLine} />
            </View>

            <View style={styles.targetCenter}>
              <QrCode size={36} color="#FFFFFF" style={{ opacity: 0.6 }} />
              <Text style={styles.targetPrompt}>بارکوڈ یا QR کوڈ کو فریم میں رکھیں</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.scanSimulateBtn}
            onPress={handleSimulatedScan}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.scanSimulateText}>بارکوڈ اسکین کریں (Scan Barcode)</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Pairing Form Card */}
        <Card style={[styles.formCard, elevation.sm]}>
          <Text style={styles.sectionTitle}>ٹریکر کی تفصیلات (Tracker Details)</Text>

          <View style={styles.inputSpacing}>
            <Text style={styles.inputLabel}>ڈیوائس IMEI نمبر (15 Digits)</Text>
            <Input
              placeholder="مثال: 864209041284719"
              value={imeiInput}
              onChangeText={(val) => {
                setImeiInput(val);
                if (imeiError) setImeiError(null);
              }}
              keyboardType="numeric"
              maxLength={15}
              error={imeiError ?? undefined}
            />
          </View>

          {/* Assigned Officer Dropdown */}
          <View style={styles.inputSpacing}>
            <Text style={styles.inputLabel}>منسلک فیلڈ آفیسر (Assign to Officer)</Text>
            <TouchableOpacity
              style={styles.officerPicker}
              onPress={() => setIsOfficerPickerOpen(!isOfficerPickerOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.selectedOfficerRow}>
                <UserCheck size={18} color={colors.primary} />
                <Text style={styles.selectedOfficerText}>
                  {selectedOfficer?.fullName || 'کوئی آفیسر منتخب نہیں'}
                </Text>
              </View>
              <ChevronDown size={18} color={colors.neutralMuted} />
            </TouchableOpacity>

            {isOfficerPickerOpen && (
              <View style={styles.pickerDropdown}>
                {ownerOfficers.map((officer) => (
                  <TouchableOpacity
                    key={officer.id}
                    style={[
                      styles.pickerOption,
                      officer.id === selectedOfficerId && styles.pickerOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedOfficerId(officer.id);
                      setIsOfficerPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        officer.id === selectedOfficerId && styles.pickerOptionTextActive,
                      ]}
                    >
                      {officer.fullName} ({officer.assignedTerritory})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Button
            title="ٹریکر کو آفیسر کے ساتھ لنک کریں (Pair Tracker)"
            onPress={handlePairTracker}
            isLoading={isPairing}
            size="lg"
            icon={<Zap size={18} color={colors.cardSurface} />}
            style={styles.pairButton}
          />
        </Card>

        {/* List of Existing Paired Hardware Trackers */}
        <Text style={styles.sectionHeading}>Registered Fleet Trackers ({trackers.length})</Text>
        {trackers.length === 0 ? (
          <Card style={[styles.emptyTrackerCard, elevation.sm]}>
            <Radio size={32} color={colors.neutralLight} />
            <Text style={styles.emptyTrackerTitle}>کوئی بیرونی ہارڈویئر ٹریکر منسلک نہیں ہے</Text>
            <Text style={styles.emptyTrackerSub}>
              تمام فیلڈ آفیسرز کی لائیو لوکیشن اور طے شدہ فاصلہ موبائل فون کے ذریعے خودکار ٹریک ہو رہا ہے۔
            </Text>
          </Card>
        ) : (
          trackers.map((tracker) => {
            const assigned = ownerOfficers.find((o) => o.id === tracker.assignedOfficerId);
            return (
              <Card key={tracker.id} style={styles.trackerCard}>
                <View style={styles.trackerHeader}>
                  <View style={styles.trackerIconBox}>
                    <Cpu size={20} color={colors.primary} />
                  </View>
                  <View style={styles.trackerInfo}>
                    <Text style={styles.trackerModel}>{tracker.model}</Text>
                    <Text style={styles.trackerImei}>IMEI: {tracker.imei}</Text>
                  </View>
                  <BatteryIndicator level={tracker.batteryLevel} />
                </View>

                <View style={styles.trackerFooter}>
                  <Text style={styles.trackerAssignment}>
                    {assigned ? (
                      <>
                        منسلک آفیسر: <Text style={styles.boldText}>{assigned.fullName}</Text>
                      </>
                    ) : (
                      <Text style={styles.unpairedText}>غیر منسلک ڈیوائس</Text>
                    )}
                  </Text>
                  <Text style={styles.lastSignal}>Ping: {tracker.lastSignalTime}</Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  comingSoonCard: {
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: spacing.cardRadius,
    marginBottom: 16,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    marginLeft: 4,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  comingSoonDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
  },
  activeMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
  },
  activeMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 5,
  },
  viewportCard: {
    backgroundColor: colors.neutralDark,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cameraBackground: {
    height: 170,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  targetFrame: {
    width: 200,
    height: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primaryLight,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: colors.dangerRed,
  },
  targetCenter: {
    alignItems: 'center',
  },
  targetPrompt: {
    color: colors.neutralLight,
    fontSize: typography.fontSizes.xs,
    marginTop: 6,
    fontWeight: typography.fontWeights.medium,
  },
  scanSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
  },
  scanSimulateText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginLeft: 6,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginBottom: 12,
  },
  inputSpacing: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginBottom: 6,
  },
  officerPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedOfficerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOfficerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralDark,
    fontWeight: typography.fontWeights.medium,
    marginLeft: 8,
  },
  pickerDropdown: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: spacing.cardRadiusSm,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralDivider,
  },
  pickerOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  pickerOptionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralDark,
  },
  pickerOptionTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  pairButton: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginBottom: 10,
  },
  emptyTrackerCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrackerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyTrackerSub: {
    fontSize: 12,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  trackerCard: {
    padding: 14,
    marginBottom: 10,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trackerInfo: {
    flex: 1,
  },
  trackerModel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  trackerImei: {
    fontSize: 11,
    color: colors.neutralMuted,
    marginTop: 1,
  },
  trackerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
  },
  trackerAssignment: {
    fontSize: 11,
    color: colors.neutralMuted,
  },
  boldText: {
    fontWeight: '700',
    color: colors.neutralDark,
  },
  unpairedText: {
    color: colors.warningAmberDark,
    fontWeight: '600',
  },
  lastSignal: {
    fontSize: 11,
    color: colors.neutralMuted,
  },
});
