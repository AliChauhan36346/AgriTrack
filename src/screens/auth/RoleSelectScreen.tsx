import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface RoleSelectScreenProps {
  onContinueToOtp?: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({ onContinueToOtp }) => {
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const setPhoneNumber = useAuthStore((state) => state.setPhoneNumber);
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [phoneInput, setPhoneInput] = useState(phoneNumber);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    onContinueToOtp?.();
  };

  const handleSendOtp = async () => {
    if (phoneInput.trim().length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError(null);
    setPhoneNumber(phoneInput);
    const success = await requestOtp(phoneInput);
    if (success) {
      onContinueToOtp?.();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Header Branding Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>AgriRoute Fleet GPS</Text>
          </View>
          <Text style={styles.brandTitle}>Welcome to AgriRoute</Text>
          <Text style={styles.brandSubtitle}>
            Offline-first location intelligence for agricultural field officers & distributor owners.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Select Your Portal Role</Text>

          {/* Role Card 1: Field Officer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleSelect('officer')}
            style={[
              styles.roleCard,
              elevation.sm,
              selectedRole === 'officer' && styles.roleCardActive,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === 'officer' }}
          >
            <View
              style={[
                styles.roleIconBox,
                selectedRole === 'officer' && styles.roleIconBoxActive,
              ]}
            >
              <UserCheck
                size={26}
                color={selectedRole === 'officer' ? colors.primary : colors.neutralMuted}
              />
            </View>

            <View style={styles.roleTextBox}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>Field Officer</Text>
                {selectedRole === 'officer' && (
                  <CheckCircle2 size={20} color={colors.primary} />
                )}
              </View>
              <Text style={styles.roleDescription}>
                GPS shift tracking, offline dealer check-ins, route sync, and territory metrics.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Role Card 2: Shop Owner / Admin */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRoleSelect('owner')}
            style={[
              styles.roleCard,
              elevation.sm,
              selectedRole === 'owner' && styles.roleCardActive,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedRole === 'owner' }}
          >
            <View
              style={[
                styles.roleIconBox,
                selectedRole === 'owner' && styles.roleIconBoxActive,
              ]}
            >
              <ShieldCheck
                size={26}
                color={selectedRole === 'owner' ? colors.primary : colors.neutralMuted}
              />
            </View>

            <View style={styles.roleTextBox}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>Shop Owner / Admin</Text>
                {selectedRole === 'owner' && (
                  <CheckCircle2 size={20} color={colors.primary} />
                )}
              </View>
              <Text style={styles.roleDescription}>
                Live fleet overview, route replay, dwell-time stop audits, and hardware tracker pairing.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Phone Input with Mobile Number */}
          <View style={styles.phoneSection}>
            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <Input
              placeholder="e.g. 0300 1234567"
              value={phoneInput}
              onChangeText={(text) => {
                setPhoneInput(text);
                if (phoneError) setPhoneError(null);
              }}
              keyboardType="phone-pad"
              maxLength={15}
              error={phoneError}
              helperText="We will send a 6-digit verification code"
            />
          </View>

          {/* Submit Button */}
          <Button
            title="Continue to Verification"
            onPress={handleSendOtp}
            isLoading={isLoading}
            size="lg"
            rightIcon={<ArrowRight size={20} color={colors.cardSurface} />}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandHeader: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.pillRadius,
    marginBottom: 12,
  },
  badgeText: {
    color: colors.primaryLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.extrabold,
    color: colors.cardSurface,
    letterSpacing: typography.letterSpacing.tighter,
  },
  brandSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.primaryLight,
    marginTop: 6,
    lineHeight: 20,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 36,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.neutralBorder,
    marginBottom: 14,
    minHeight: 88,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F7FCF9',
  },
  roleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.neutralDivider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleIconBoxActive: {
    backgroundColor: colors.primaryLight,
  },
  roleTextBox: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  roleDescription: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    lineHeight: 17,
  },
  phoneSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 8,
  },
});
