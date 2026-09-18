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
  const offlineQueue = useTrackingStore((state) => state.offlineQueue);
  const isSyncing = useTrackingStore((state) => state.isSyncing);
  const isSimulatedOffline = useTrackingStore((state) => state.isSimulatedOffline);
  const syncQueue = useTrackingStore((state) => state.syncQueue);
  const lastSyncTime = useTrackingStore((state) => state.lastSyncTime);

  const queuedCount = offlineQueue.length;
  const isOffline = isSimulatedOffline || queuedCount > 0;

  const handleSyncPress = async () => {
    if (isSyncing) return;
    await syncQueue();
  };

  if (!isOffline && queuedCount === 0) {
    return (
      <View style={[styles.container, styles.syncedContainer, style]}>
        <View style={styles.contentRow}>
          <CheckCircle2 size={18} color={colors.primary} />
          <Text style={styles.syncedText}>
            All data synced {lastSyncTime ? `• ${lastSyncTime}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.offlineContainer, style]}>
      <View style={styles.contentRow}>
        <WifiOff size={18} color={colors.warningAmberDark} />
        <View style={styles.textColumn}>
          <Text style={styles.offlineTitle}>
            Offline Mode: {queuedCount} {queuedCount === 1 ? 'point' : 'points'} queued
          </Text>
          <Text style={styles.offlineSubtitle}>
            Coordinates will automatically sync when network returns
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleSyncPress}
        disabled={isSyncing}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Retry syncing offline queue"
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.cardSurface} />
        ) : (
          <View style={styles.retryInner}>
            <RefreshCw size={14} color={colors.cardSurface} style={styles.refreshIcon} />
            <Text style={styles.retryText}>Sync Now</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: spacing.cardRadiusSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  syncedContainer: {
    backgroundColor: colors.primaryLight,
    borderColor: '#A3CFBB',
    borderWidth: 1,
  },
  offlineContainer: {
    backgroundColor: colors.warningAmberLight,
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  textColumn: {
    marginLeft: 10,
    flex: 1,
  },
  syncedText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    marginLeft: 8,
  },
  offlineTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.warningAmberDark,
  },
  offlineSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 1,
  },
  retryButton: {
    backgroundColor: colors.warningAmberDark,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    minWidth: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    marginRight: 4,
  },
  retryText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.cardSurface,
  },
});
