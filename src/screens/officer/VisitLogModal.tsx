import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, MapPin, Store, FileText, CheckCircle2 } from 'lucide-react-native';
import { VisitLog } from '../../types';
import { useTrackingStore } from '../../store/trackingStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface VisitLogModalProps {
  visible: boolean;
  onClose: () => void;
}

const PURPOSES: Array<VisitLog['purpose']> = [
  'Fertilizer Inspection',
  'Pesticide Order',
  'Seed Sampling',
  'Payment Collection',
  'General Follow-up',
];

export const VisitLogModal: React.FC<VisitLogModalProps> = ({ visible, onClose }) => {
  const currentOfficer = useAuthStore((state) => state.currentOfficer);
  const addVisitLog = useTrackingStore((state) => state.addVisitLog);
  const currentBreadcrumb = useTrackingStore((state) => state.currentBreadcrumb);

  const [dealerName, setDealerName] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<VisitLog['purpose']>('Fertilizer Inspection');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = () => {
    if (!dealerName.trim()) {
      setError('Please enter the agricultural dealer/shop name');
      return;
    }

    addVisitLog({
      dealerName: dealerName.trim(),
      officerId: currentOfficer?.id ?? 'off-01',
      officerName: currentOfficer?.name ?? 'Field Officer',
      purpose: selectedPurpose,
      notes: notes.trim() || 'Routine agronomy visit and dealer follow-up.',
      latitude: currentBreadcrumb?.latitude ?? 22.3072,
      longitude: currentBreadcrumb?.longitude ?? 73.1812,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setDealerName('');
      setNotes('');
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Dealer Visit Check-in</Text>
              <Text style={styles.headerSubtitle}>
                Auto-tagged with current GPS location
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close check-in modal"
            >
              <X size={20} color={colors.neutralDark} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircle2 size={56} color={colors.primary} />
              <Text style={styles.successTitle}>Visit Logged Successfully!</Text>
              <Text style={styles.successSubtitle}>
                Saved locally to queue and will sync to backend.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              {/* GPS Stamp Pill */}
              <View style={styles.gpsStamp}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.gpsText}>
                  GPS: {currentBreadcrumb?.latitude.toFixed(4) ?? '22.3072'} N,{' '}
                  {currentBreadcrumb?.longitude.toFixed(4) ?? '73.1812'} E (±4m)
                </Text>
              </View>

              {/* Dealer Name */}
              <Input
                label="Dealer / Krishi Kendra Name *"
                placeholder="e.g. Kisan Seva Kendra"
                value={dealerName}
                onChangeText={(t) => {
                  setDealerName(t);
                  if (error) setError(null);
                }}
                leftIcon={<Store size={18} color={colors.neutralMuted} />}
                error={error}
              />

              {/* Purpose Selector Chips */}
              <Text style={styles.fieldLabel}>Visit Purpose</Text>
              <View style={styles.chipsRow}>
                {PURPOSES.map((purpose) => {
                  const isSelected = selectedPurpose === purpose;
                  return (
                    <TouchableOpacity
                      key={purpose}
                      onPress={() => setSelectedPurpose(purpose)}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {purpose}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Observation Notes */}
              <Input
                label="Visit Notes & Observations"
                placeholder="Stock levels, farmer queries, fertilizer samples..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                leftIcon={<FileText size={18} color={colors.neutralMuted} />}
              />

              {/* Submit Button */}
              <Button
                title="Save & Geotag Check-in"
                onPress={handleSubmit}
                size="lg"
                style={styles.submitBtn}
              />
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayBackdrop,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutralDivider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyScroll: {
    padding: 20,
  },
  gpsStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  gpsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
    marginLeft: 6,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginTop: 10,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: spacing.pillRadius,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralDark,
    fontWeight: typography.fontWeights.medium,
  },
  chipTextActive: {
    color: colors.cardSurface,
    fontWeight: typography.fontWeights.bold,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 18,
    marginBottom: 10,
  },
  successContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
