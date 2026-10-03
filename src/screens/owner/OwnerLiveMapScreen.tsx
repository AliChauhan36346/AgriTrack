import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  PlayCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  Navigation,
  Clock,
  MapPin,
  Cpu,
  UserPlus,
} from 'lucide-react-native';
import { MapFilterType, FieldOfficer } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useFilterStore } from '../../store/filterStore';
import { subscribeToLiveFleet, fetchOfficersFromCloud } from '../../services/supabase';
import { MapContainer } from '../../components/map/MapContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BatteryIndicator } from '../../components/feedback/BatteryIndicator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OwnerLiveMapScreenProps {
  onNavigateToPlayback?: (officerId: string) => void;
  onNavigateToTeam?: () => void;
}

export const OwnerLiveMapScreen: React.FC<OwnerLiveMapScreenProps> = ({
  onNavigateToPlayback,
  onNavigateToTeam,
}) => {
  const currentOwner = useAuthStore((state) => state.currentOwner);
  const registeredOfficers = useAuthStore((state) => state.registeredOfficers);

  // Subscribe to real-time live fleet tracking from Supabase Cloud
  useEffect(() => {
    if (!currentOwner) return;

    // Load any existing officers from cloud
    fetchOfficersFromCloud(currentOwner.id).then((cloudOfficers) => {
      if (cloudOfficers && cloudOfficers.length > 0) {
        useAuthStore.getState().mergeOfficersFromCloud(cloudOfficers);
      }
    });

    // Subscribe to live WebSocket position updates
    const unsubscribe = subscribeToLiveFleet(currentOwner.id, (updatedOfficer) => {
      useAuthStore.getState().updateOfficerFromCloudPayload(updatedOfficer);
    });

    return () => {
      unsubscribe();
    };
  }, [currentOwner?.id]);

  // Scope officers exclusively to the current shop owner
  const ownerOfficers = useMemo(() => {
    if (!currentOwner) return registeredOfficers.filter((o) => !o.id.startsWith('off-0'));
    return registeredOfficers.filter((o) => o.ownerId === currentOwner.id);
  }, [registeredOfficers, currentOwner]);

  const activeFilter = useFilterStore((state) => state.activeFilter);
  const setFilter = useFilterStore((state) => state.setFilter);
  const selectedOfficerId = useFilterStore((state) => state.selectedOfficerId);
  const setSelectedOfficerId = useFilterStore((state) => state.setSelectedOfficerId);

  // Quick fleet sheet modal state
  const [showListModal, setShowListModal] = useState(false);

  const filteredOfficers = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return ownerOfficers.filter(
          (o) => o.currentStatus === 'active' || o.currentStatus === 'stationary'
        );
      case 'offline':
        return ownerOfficers.filter((o) => o.currentStatus === 'offline');
      case 'all':
      default:
        return ownerOfficers;
    }
  }, [ownerOfficers, activeFilter]);

  const selectedOfficer = useMemo(() => {
    if (ownerOfficers.length === 0) return null;
    return (
      filteredOfficers.find((o) => o.id === selectedOfficerId) ??
      filteredOfficers[0] ??
      ownerOfficers[0]
    );
  }, [selectedOfficerId, filteredOfficers, ownerOfficers]);

  // Index of currently selected officer in filtered list
  const selectedIndex = useMemo(() => {
    if (!selectedOfficer || filteredOfficers.length === 0) return 0;
    const idx = filteredOfficers.findIndex((o) => o.id === selectedOfficer.id);
    return idx >= 0 ? idx : 0;
  }, [filteredOfficers, selectedOfficer]);

  const handlePrevOfficer = () => {
    if (filteredOfficers.length === 0) return;
    const prevIdx = (selectedIndex - 1 + filteredOfficers.length) % filteredOfficers.length;
    setSelectedOfficerId(filteredOfficers[prevIdx].id);
  };

  const handleNextOfficer = () => {
    if (filteredOfficers.length === 0) return;
    const nextIdx = (selectedIndex + 1) % filteredOfficers.length;
    setSelectedOfficerId(filteredOfficers[nextIdx].id);
  };

  const handleCallOfficer = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const filterTabs: Array<{ id: MapFilterType; label: string; count: number }> = [
    { id: 'all', label: 'All Fleet', count: ownerOfficers.length },
    {
      id: 'active',
      label: 'Active',
      count: ownerOfficers.filter(
        (o) => o.currentStatus === 'active' || o.currentStatus === 'stationary'
      ).length,
    },
    {
      id: 'offline',
      label: 'Offline',
      count: ownerOfficers.filter((o) => o.currentStatus === 'offline').length,
    },
  ];

  const mapHeight = SCREEN_HEIGHT * 0.76;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5E9" />

      <View style={styles.container}>
        {/* Real Interactive OpenStreetMap & Leaflet Map */}
        <MapContainer
          height={mapHeight}
          officers={filteredOfficers}
          selectedOfficerId={selectedOfficer?.id}
          onOfficerSelect={setSelectedOfficerId}
        />

        {/* Floating Filter Pills Header (Top of Map - Uber / Careem style) */}
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

            {/* Quick Fleet List Icon Button */}
            <TouchableOpacity
              style={styles.listToggleBtn}
              onPress={() => setShowListModal(true)}
              activeOpacity={0.7}
              accessibilityLabel="View officer directory"
            >
              <List size={18} color={colors.neutralDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty Fleet Notice Overlay when no officers exist yet */}
        {ownerOfficers.length === 0 && (
          <View style={[styles.emptyFleetCard, elevation.lg]}>
            <Users size={36} color={colors.primary} />
            <Text style={styles.emptyFleetTitle}>کوئی فیلڈ آفیسر شامل نہیں ہے</Text>
            <Text style={styles.emptyFleetSub}>
              لائیو میپ پر لوکیشن اور طے شدہ فاصلہ دیکھنے کے لیے فیلڈ آفیسرز شامل کریں۔
            </Text>
          </View>
        )}

        {/* Sleek Compact Floating FO Info Card (Bottom of Screen) */}
        {selectedOfficer && (
          <View style={[styles.compactInfoCard, elevation.lg]}>
            {/* Officer Primary Row: Avatar + Name + Badges */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.officerAvatarPuck}>
                <Text style={styles.avatarText}>
                  {selectedOfficer.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.avatarStatusDot,
                    selectedOfficer.currentStatus === 'active'
                      ? styles.dotActive
                      : selectedOfficer.currentStatus === 'stationary'
                      ? styles.dotStationary
                      : styles.dotOffline,
                  ]}
                />
              </View>

              <View style={styles.officerDetailsCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.officerName} numberOfLines={1}>
                    {selectedOfficer.fullName}
                  </Text>
                </View>
                <Text style={styles.officerTerritory} numberOfLines={1}>
                  {selectedOfficer.assignedTerritory}
                </Text>
              </View>

              {/* Status and Battery block */}
              <View style={styles.headerRightCol}>
                <StatusBadge status={selectedOfficer.currentStatus} size="sm" />
                <View style={styles.batteryWrapper}>
                  <BatteryIndicator
                    level={selectedOfficer.batteryLevel}
                    isCharging={selectedOfficer.isCharging}
                  />
                </View>
              </View>
            </View>

            {/* Telemetry Metrics & Kilometers Done Strip */}
            <View style={styles.telemetryStrip}>
              <View style={[styles.telemetryPill, styles.distancePill]}>
                <Navigation size={12} color={colors.accentBlue} />
                <Text style={[styles.telemetryPillText, styles.distancePillText]}>
                  {selectedOfficer.todayDistanceKm || 0} km Done Today (فاصلہ)
                </Text>
              </View>

              <View style={styles.telemetryPill}>
                <Clock size={11} color={colors.primary} />
                <Text style={styles.telemetryPillText}>
                  {selectedOfficer.workingHoursDisplay || '09:00 AM - 06:00 PM'}
                </Text>
              </View>

              <View style={styles.telemetryPill}>
                <Text style={styles.telemetryPillText}>
                  {selectedOfficer.speedKmh > 0
                    ? `⚡ ${selectedOfficer.speedKmh} km/h`
                    : '🅿️ Stopped'}
                </Text>
              </View>

              <View style={styles.telemetryPill}>
                <Text style={styles.telemetryPillText}>
                  {selectedOfficer.lastSeenAt || 'Just now'}
                </Text>
              </View>
            </View>

            {/* Action Row & Officer Paging Controls */}
            <View style={styles.cardActionRow}>
              {/* Previous / Next officer pagers */}
              <View style={styles.pagerControls}>
                <TouchableOpacity
                  onPress={handlePrevOfficer}
                  style={styles.pagerBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous officer"
                >
                  <ChevronLeft size={18} color={colors.neutralDark} />
                </TouchableOpacity>
                <Text style={styles.pagerCounterText}>
                  {selectedIndex + 1}/{filteredOfficers.length}
                </Text>
                <TouchableOpacity
                  onPress={handleNextOfficer}
                  style={styles.pagerBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Next officer"
                >
                  <ChevronRight size={18} color={colors.neutralDark} />
                </TouchableOpacity>
              </View>

              {/* Replay Route Button */}
              <TouchableOpacity
                style={styles.replayButton}
                onPress={() => onNavigateToPlayback?.(selectedOfficer.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Replay officer route history"
              >
                <PlayCircle size={16} color="#FFFFFF" />
                <Text style={styles.replayButtonText}>Replay Route</Text>
              </TouchableOpacity>

              {/* Call Officer Button */}
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallOfficer(selectedOfficer.phone)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Call ${selectedOfficer.fullName}`}
              >
                <Phone size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal Sheet for Complete Officer List */}
        <Modal
          visible={showListModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowListModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, elevation.lg]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Users size={20} color={colors.primary} />
                  <Text style={styles.modalTitle}>
                    Field Officers Directory ({ownerOfficers.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowListModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={colors.neutralDark} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={ownerOfficers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalListContent}
                ListEmptyComponent={
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: colors.neutralMuted }}>
                      No officers registered yet
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isCurrent = item.id === selectedOfficer?.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalOfficerRow,
                        isCurrent && styles.modalOfficerRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedOfficerId(item.id);
                        setShowListModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalOfficerInfo}>
                        <Text style={styles.modalOfficerName}>{item.fullName}</Text>
                        <Text style={styles.modalOfficerSub}>
                          {item.assignedTerritory} • {item.todayDistanceKm || 0} km • {item.workingHoursDisplay || '09:00 AM - 06:00 PM'}
                        </Text>
                      </View>
                      <StatusBadge status={item.currentStatus} size="sm" />
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5E9',
  },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5E9',
  },
  floatingHeader: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 25,
  },
  pillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    minHeight: 36,
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
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  countBadge: {
    backgroundColor: colors.neutralDivider,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  countText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  listToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    marginLeft: 4,
  },

  // Empty Fleet Card
  emptyFleetCard: {
    position: 'absolute',
    top: '32%',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  emptyFleetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyFleetSub: {
    fontSize: 12,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Sleek Compact Floating FO Info Card (~145dp)
  compactInfoCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    zIndex: 30,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerAvatarPuck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
  dotStationary: {
    backgroundColor: '#F59E0B',
  },
  dotOffline: {
    backgroundColor: '#94A3B8',
  },
  officerDetailsCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  officerTerritory: {
    fontSize: 11,
    color: colors.neutralMuted,
    marginTop: 1,
  },
  headerRightCol: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  batteryWrapper: {
    marginTop: 4,
  },

  // Telemetry row
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  distancePill: {
    backgroundColor: '#EFF6FF',
  },
  telemetryPillText: {
    fontSize: 10.5,
    color: colors.neutralMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  distancePillText: {
    color: colors.accentBlue,
    fontWeight: '700',
  },

  // Action & Pager Row
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
  },
  pagerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 8,
  },
  pagerBtn: {
    padding: 3,
  },
  pagerCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutralDark,
    marginHorizontal: 3,
  },
  replayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    minHeight: 40,
    marginRight: 8,
  },
  replayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Directory Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralDivider,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutralDark,
    marginLeft: 8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalOfficerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralDivider,
  },
  modalOfficerRowSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalOfficerInfo: {
    flex: 1,
    marginRight: 8,
  },
  modalOfficerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  modalOfficerSub: {
    fontSize: 11,
    color: colors.neutralMuted,
    marginTop: 2,
  },
});
