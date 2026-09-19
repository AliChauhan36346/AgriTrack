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
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { mockOfficers, mockHardwareTrackers } from '../../mockData';
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
  const [trackers, setTrackers] = useState<HardwareTracker[]>(mockHardwareTrackers);
  const [imeiInput, setImeiInput] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(mockOfficers[0].id);
  const [isOfficerPickerOpen, setIsOfficerPickerOpen] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [imeiError, setImeiError] = useState<string | null>(null);

  const selectedOfficer = mockOfficers.find((o) => o.id === selectedOfficerId) ?? mockOfficers[0];

  const handleSimulatedScan = () => {
    // Generate/inject a mock scanned IMEI
    const sampleImei = `86420904${Math.floor(1000000 + Math.random() * 9000000)}`;
    setImeiInput(sampleImei);
    setImeiError(null);
  };

  const handlePairTracker = async () => {
    const cleaned = imeiInput.replace(/\s+/g, '');
    if (cleaned.length !== 15) {
      setImeiError('IMEI must be exactly 15 numeric digits');
      return;
    }

    setImeiError(null);
    setIsPairing(true);

    // Simulate cryptographic handshake with tracker gateway
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newTracker: HardwareTracker = {
      id: `trk-${Date.now()}`,
      imei: cleaned,
      model: 'Teltonika FMB920 Agro',
      assignedOfficerId: selectedOfficerId,
      batteryLevel: 98,
      status: 'active',
      lastSignalTime: 'Just now',
      firmwareVersion: 'v03.28.05',
    };

    setTrackers((prev) => [newTracker, ...prev]);
    setIsPairing(false);
    setImeiInput('');

    Alert.alert(
      'Tracker Paired Successfully',
      `Hardware GPS (IMEI: ${cleaned}) has been linked to ${selectedOfficer.name}. Data will now be mapped to their territory routes.`
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
            Pair vehicle OBD/magnetic GPS units with field officers for autonomous tracking.
          </Text>
        </View>

        {/* Camera Viewport Frame with Barcode/QR Targeting Box */}
        <View style={[styles.viewportCard, elevation.md]}>
          <View style={styles.cameraBackground}>
            {/* Viewport scan targeting box */}
            <View style={styles.targetFrame}>
              <View style={[styles.cornerMarker, styles.cornerTopLeft]} />
              <View style={[styles.cornerMarker, styles.cornerTopRight]} />
              <View style={[styles.cornerMarker, styles.cornerBottomLeft]} />
              <View style={[styles.cornerMarker, styles.cornerBottomRight]} />

              {/* Animated laser scanning line */}
              <View style={styles.laserLine} />

              <View style={styles.targetCenter}>
                <QrCode size={36} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.targetPrompt}>Align Barcode / QR Code</Text>
              </View>
            </View>
          </View>

          {/* Simulate QR scan tap button */}
          <TouchableOpacity
            style={styles.scanSimulateBtn}
            onPress={handleSimulatedScan}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Simulate barcode camera scan"
          >
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.scanSimulateText}>Tap to Simulate Camera Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Manual IMEI Input Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Manual IMEI & Pairing</Text>

          <Input
            label="Device IMEI Number (15 Digits)"
            placeholder="e.g. 864209041284719"
            value={imeiInput}
            onChangeText={(t) => {
              setImeiInput(t);
              if (imeiError) setImeiError(null);
            }}
            keyboardType="number-pad"
            maxLength={18}
            error={imeiError}
            leftIcon={<Cpu size={18} color={colors.neutralMuted} />}
          />

          {/* Officer Selector Dropdown */}
          <Text style={styles.fieldLabel}>Assign To Field Officer</Text>
          <TouchableOpacity
            style={styles.officerSelector}
            onPress={() => setIsOfficerPickerOpen(!isOfficerPickerOpen)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Selected officer: ${selectedOfficer.name}`}
          >
            <View style={styles.officerSelectorLeft}>
              <UserCheck size={18} color={colors.primary} />
              <View style={styles.officerSelectorText}>
                <Text style={styles.selectedOfficerName}>{selectedOfficer.name}</Text>
                <Text style={styles.selectedOfficerTerritory}>
                  {selectedOfficer.assignedTerritory}
                </Text>
              </View>
            </View>
            <ChevronDown size={20} color={colors.neutralMuted} />
          </TouchableOpacity>

          {/* Officer Picker Dropdown List */}
          {isOfficerPickerOpen && (
            <View style={styles.pickerDropdown}>
              {mockOfficers.map((off) => {
                const isCurrent = off.id === selectedOfficerId;
                return (
                  <TouchableOpacity
                    key={off.id}
                    style={[styles.pickerItem, isCurrent && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedOfficerId(off.id);
                      setIsOfficerPickerOpen(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.pickerItemName, isCurrent && styles.pickerItemNameActive]}>
                        {off.name}
                      </Text>
                      <Text style={styles.pickerItemTerritory}>{off.assignedTerritory}</Text>
                    </View>
                    {isCurrent && <CheckCircle2 size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Pair Tracker Button */}
          <Button
            title="Pair Tracker to Officer"
            onPress={handlePairTracker}
            isLoading={isPairing}
            size="lg"
            icon={<Zap size={18} color={colors.cardSurface} />}
            style={styles.pairButton}
          />
        </Card>

        {/* List of Existing Paired Hardware Trackers */}
        <Text style={styles.sectionHeading}>Registered Fleet Trackers ({trackers.length})</Text>
        {trackers.map((tracker) => {
          const assigned = mockOfficers.find((o) => o.id === tracker.assignedOfficerId);
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
                      Assigned to: <Text style={styles.boldText}>{assigned.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.unpairedText}>Unpaired Device</Text>
                  )}
                </Text>
                <Text style={styles.lastSignal}>Ping: {tracker.lastSignalTime}</Text>
              </View>
            </Card>
          );
        })}
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
    marginBottom: 16,
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
  viewportCard: {
    backgroundColor: colors.neutralDark,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cameraBackground: {
    height: 190,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  targetFrame: {
    width: 220,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
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
    shadowColor: colors.dangerRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
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
  fieldLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginTop: 8,
    marginBottom: 6,
  },
  officerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1.5,
    borderColor: colors.neutralBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: spacing.inputHeight, // >= 48dp touch target
  },
  officerSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerSelectorText: {
    marginLeft: 10,
  },
  selectedOfficerName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  selectedOfficerTerritory: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  pickerDropdown: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralDivider,
  },
  pickerItemActive: {
    backgroundColor: '#F7FCF9',
  },
  pickerItemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
  },
  pickerItemNameActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  pickerItemTerritory: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  pairButton: {
    marginTop: 18,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  trackerCard: {
    padding: 14,
    marginBottom: 10,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackerInfo: {
    flex: 1,
  },
  trackerModel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  trackerImei: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 1,
  },
  trackerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
  },
  trackerAssignment: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  boldText: {
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  unpairedText: {
    color: colors.warningAmberDark,
    fontWeight: typography.fontWeights.semibold,
  },
  lastSignal: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralLight,
  },
});
