import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react-native';
import { useTrackingStore } from '../../store/trackingStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SyncBannerProps {
  style?: StyleProp<ViewStyle>;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ style }) => {
  const unsyncedCount = useTrackingStore((state) => state.unsyncedCount);
  const isOnline = useTrackingStore((state) => state.isOnline);
  const isSyncing = useTrackingStore((state) => state.isSyncing);
  const triggerSync = useTrackingStore((state) => state.triggerSync);

  // Case 1: Device is Offline
  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer, style]}>
        <View style={styles.contentRow}>
          <WifiOff size={18} color={colors.warningAmberDark} style={styles.statusIcon} />
          <Text style={styles.offlineText}>
            Offline Mode — {unsyncedCount} {unsyncedCount === 1 ? 'location' : 'locations'} saved safely on phone.
          </Text>
        </View>
      </View>
    );
  }

  // Case 2: Online with items queued (Syncing / Pending Sync)
  if (isOnline && unsyncedCount > 0) {
    return (
      <View style={[styles.container, styles.syncingContainer, style]}>
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color={colors.accentBlue} style={styles.spinner} />
          <Text style={styles.syncingText}>
            Back Online — Syncing {unsyncedCount} {unsyncedCount === 1 ? 'location' : 'locations'}...
          </Text>
        </View>

        {!isSyncing && (
          <TouchableOpacity
            style={styles.syncNowButton}
            onPress={() => triggerSync()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sync queued locations now"
          >
            <RefreshCw size={13} color={colors.accentBlue} style={styles.refreshIcon} />
            <Text style={styles.syncNowText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Case 3: Online and completely synced
  return (
    <View style={[styles.container, styles.syncedContainer, style]}>
      <View style={styles.contentRow}>
        <CheckCircle2 size={18} color={colors.primary} style={styles.statusIcon} />
        <Text style={styles.syncedText}>
          All locations synced with main shop.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: spacing.cardRadiusSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    borderWidth: 1,
  },
  syncedContainer: {
    backgroundColor: '#EDF7ED',
    borderColor: '#C8E6C9',
  },
  syncingContainer: {
    backgroundColor: colors.accentBlueLight,
    borderColor: '#BFDBFE',
  },
  offlineContainer: {
    backgroundColor: colors.warningAmberLight,
    borderColor: '#FDE68A',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 10,
  },
  spinner: {
    marginRight: 10,
  },
  syncedText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    flex: 1,
  },
  syncingText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.accentBlue,
    flex: 1,
  },
  offlineText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.warningAmberDark,
    flex: 1,
    lineHeight: 18,
  },
  syncNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 8,
  },
  refreshIcon: {
    marginRight: 4,
  },
  syncNowText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
  },
});
