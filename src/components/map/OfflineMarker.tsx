import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Bike, WifiOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { elevation } from '../../theme/elevation';

interface OfflineMarkerProps {
  name: string;
  lastPingTime: string;
  isSelected?: boolean;
}

export const OfflineMarker: React.FC<OfflineMarkerProps> = ({
  name,
  lastPingTime,
  isSelected = false,
}) => {
  const firstName = name.split(' ')[0] || name;

  return (
    <View style={styles.wrapper}>
      {/* Floating Offline Status Callout */}
      <View
        style={[
          styles.statusPill,
          elevation.sm,
          isSelected && styles.statusPillSelected,
        ]}
      >
        <WifiOff size={10} color="#94A3B8" style={styles.iconSpacing} />
        <Text
          style={[
            styles.statusPillText,
            isSelected && styles.statusPillTextSelected,
          ]}
          numberOfLines={1}
        >
          {lastPingTime}
        </Text>
      </View>

      {/* Pin Body Container */}
      <View style={styles.pinBodyContainer}>
        {/* Selected Highlight Aura */}
        {isSelected && <View style={styles.selectedAura} />}

        {/* Offline Vehicle Puck */}
        <View style={[styles.vehicleDisc, isSelected && styles.vehicleDiscSelected]}>
          <Bike size={18} color="#94A3B8" />
        </View>

        {/* Officer Name Tag */}
        <View style={styles.nameTag}>
          <Text style={styles.nameText} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
      </View>

      {/* Ground Anchor Shadow */}
      <View style={styles.groundShadow} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Muted slate
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 4,
    zIndex: 10,
  },
  statusPillSelected: {
    backgroundColor: '#334155',
    borderColor: '#64748B',
  },
  iconSpacing: {
    marginRight: 4,
  },
  statusPillText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semibold,
    color: '#64748B',
  },
  statusPillTextSelected: {
    color: '#FFFFFF',
  },
  pinBodyContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedAura: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  vehicleDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0', // Neutral muted slate
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 5,
  },
  vehicleDiscSelected: {
    backgroundColor: '#CBD5E1',
    borderColor: '#334155',
    transform: [{ scale: 1.05 }],
  },
  nameTag: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: 'rgba(71, 85, 105, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    zIndex: 8,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  groundShadow: {
    width: 16,
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginTop: 12,
  },
});
