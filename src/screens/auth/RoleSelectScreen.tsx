import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Store,
  Sparkles,
  Phone,
} from 'lucide-react-native';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OwnerRegisterModal } from './OwnerRegisterModal';
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
  const loginWithAccessCode = useAuthStore((state) => state.loginWithAccessCode);
  const loginAs = useAuthStore((state) => state.loginAs);
  const authError = useAuthStore((state) => state.error);
  const registeredOfficers = useAuthStore((state) => state.registeredOfficers);
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const setPhoneNumber = useAuthStore((state) => state.setPhoneNumber);
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Field Officer Code State
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [officerError, setOfficerError] = useState<string | null>(null);

  // Owner Phone State
  const [ownerPhoneInput, setOwnerPhoneInput] = useState(phoneNumber);
  const [ownerPhoneError, setOwnerPhoneError] = useState<string | null>(null);

  // Owner Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setOfficerError(null);
    setOwnerPhoneError(null);
  };

  const handleOfficerLogin = (codeToUse?: string) => {
    const code = codeToUse || accessCodeInput;
    if (!code.trim()) {
      setOfficerError('براہ کرم اپنا آفیسر رسائی کوڈ درج کریں (Please enter your access code)');
      return;
    }
    setOfficerError(null);
    const result = loginWithAccessCode(code);
    if (!result.success && result.error) {
      setOfficerError(result.error);
    }
  };

  const handleOwnerPhoneLogin = async () => {
    if (ownerPhoneInput.trim().length < 10) {
      setOwnerPhoneError('درست 10 ہندسوں کا موبائل نمبر درج کریں');
      return;
    }
    setOwnerPhoneError(null);
    setPhoneNumber(ownerPhoneInput);
    const success = await requestOtp(ownerPhoneInput);
    if (success) {
      onContinueToOtp?.();
    }
  };

  const handleDemoOwnerLogin = () => {
    loginAs('owner');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding Banner */}
          <View style={styles.brandHeader}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>AgriRoute Fleet GPS</Text>
            </View>
            <Text style={styles.brandTitle}>AgriRoute (ایگری روٹ)</Text>
            <Text style={styles.brandSubtitle}>
              زرعی فیلڈ آفیسرز کی آف لائن لوکیشن ٹریکنگ اور دکان داروں کے لیے لائیو مانیٹرنگ
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionHeading}>
              اپنا کردار منتخب کریں (Select Your Role):
            </Text>

            {/* High-Visibility Role Selection Cards */}
            <View style={styles.roleCardRow}>
              {/* Card 1: Field Officer */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRoleSelect('officer')}
                style={[
                  styles.roleCard,
                  selectedRole === 'officer'
                    ? styles.roleCardActive
                    : styles.roleCardInactive,
                ]}
              >
                <View style={styles.roleCardTop}>
                  <View
                    style={[
                      styles.roleIconBox,
                      selectedRole === 'officer'
                        ? styles.roleIconBoxActive
                        : styles.roleIconBoxInactive,
                    ]}
                  >
                    <UserCheck
                      size={24}
                      color={selectedRole === 'officer' ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  {selectedRole === 'officer' ? (
                    <View style={styles.activeCheckPill}>
                      <CheckCircle2 size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.activeCheckText}>منتخب</Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveDot} />
                  )}
                </View>

                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'officer'
                      ? styles.roleCardTitleActive
                      : styles.roleCardTitleInactive,
                  ]}
                >
                  فیلڈ آفیسر
                </Text>
                <Text
                  style={[
                    styles.roleCardSubtitle,
                    selectedRole === 'officer'
                      ? styles.roleCardSubtitleActive
                      : styles.roleCardSubtitleInactive,
                  ]}
                >
                  Field Officer
                </Text>
              </TouchableOpacity>

              {/* Card 2: Shop Owner */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRoleSelect('owner')}
                style={[
                  styles.roleCard,
                  selectedRole === 'owner'
                    ? styles.roleCardActive
                    : styles.roleCardInactive,
                ]}
              >
                <View style={styles.roleCardTop}>
                  <View
                    style={[
                      styles.roleIconBox,
                      selectedRole === 'owner'
                        ? styles.roleIconBoxActive
                        : styles.roleIconBoxInactive,
                    ]}
                  >
                    <Store
                      size={24}
                      color={selectedRole === 'owner' ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  {selectedRole === 'owner' ? (
                    <View style={styles.activeCheckPill}>
                      <CheckCircle2 size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.activeCheckText}>منتخب</Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveDot} />
                  )}
                </View>

                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'owner'
                      ? styles.roleCardTitleActive
                      : styles.roleCardTitleInactive,
                  ]}
                >
                  دکان دار
                </Text>
                <Text
                  style={[
                    styles.roleCardSubtitle,
                    selectedRole === 'owner'
                      ? styles.roleCardSubtitleActive
                      : styles.roleCardSubtitleInactive,
                  ]}
                >
                  Shop Owner
                </Text>
              </TouchableOpacity>
            </View>

            {/* ========================================================================= */}
            {/* TAB 1: FIELD OFFICER - ACCESS CODE ONLY LOGIN                             */}
            {/* ========================================================================= */}
            {selectedRole === 'officer' && (
              <View style={styles.tabContentContainer}>
                <View style={styles.infoBanner}>
                  <KeyRound size={20} color={colors.primary} style={styles.infoBannerIcon} />
                  <View style={styles.infoBannerTextWrap}>
                    <Text style={styles.infoBannerTitle}>صرف رسائی کوڈ سے لاگ ان</Text>
                    <Text style={styles.infoBannerSubtitle}>
                      کسی پاسورڈ یا ای میل کی ضرورت نہیں۔ دکان دار کا دیا گیا کوڈ درج کریں۔
                    </Text>
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    آفیسر رسائی کوڈ درج کریں (Officer Access Code) *
                  </Text>
                  <Input
                    placeholder="مثال: FO-101 یا FO-4892"
                    value={accessCodeInput}
                    onChangeText={(val) => {
                      setAccessCodeInput(val.toUpperCase());
                      if (officerError) setOfficerError(null);
                    }}
                    autoCapitalize="characters"
                    maxLength={10}
                    leftIcon={<KeyRound size={18} color={colors.primary} />}
                    error={officerError || authError || undefined}
                  />
                </View>

                {/* Submit Officer Login Button */}
                <Button
                  title="شفت شروع کریں (Enter Shift / Login)"
                  onPress={() => handleOfficerLogin()}
                  size="lg"
                  rightIcon={<ArrowRight size={20} color={colors.cardSurface} />}
                  style={styles.primaryActionBtn}
                />

                {/* Quick Demo Officer Codes for Immediate Testing */}
                <View style={styles.demoSection}>
                  <View style={styles.demoSectionHeader}>
                    <Sparkles size={14} color={colors.accentBlue} />
                    <Text style={styles.demoSectionTitle}>
                      ٹیسٹنگ کے لیے کلک کریں (Quick Demo Codes):
                    </Text>
                  </View>
                  <View style={styles.demoChipsRow}>
                    {registeredOfficers.slice(0, 3).map((off) => (
                      <TouchableOpacity
                        key={off.id}
                        style={styles.demoChip}
                        onPress={() => {
                          setAccessCodeInput(off.accessCode);
                          handleOfficerLogin(off.accessCode);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.demoChipCode}>{off.accessCode}</Text>
                        <Text style={styles.demoChipName}>
                          {off.fullName.split(' ')[0]} ({off.assignedTerritory.split(' ')[0]})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: SHOP OWNER - REGISTER NEW SHOP OR LOGIN                           */}
            {/* ========================================================================= */}
            {selectedRole === 'owner' && (
              <View style={styles.tabContentContainer}>
                <View style={styles.infoBanner}>
                  <ShieldCheck size={20} color={colors.primary} style={styles.infoBannerIcon} />
                  <View style={styles.infoBannerTextWrap}>
                    <Text style={styles.infoBannerTitle}>دکان دار اور ڈسٹری بیوٹر پورٹل</Text>
                    <Text style={styles.infoBannerSubtitle}>
                      اپنے فیلڈ آفیسرز کو شامل کریں، کوڈز جاری کریں اور لائیو روٹس دیکھیں۔
                    </Text>
                  </View>
                </View>

                {/* Button A: Register New Shop Account */}
                <TouchableOpacity
                  style={[styles.registerShopBtn, elevation.sm]}
                  onPress={() => setIsRegisterModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.registerIconBox}>
                    <Store size={22} color={colors.primary} />
                  </View>
                  <View style={styles.registerTextBox}>
                    <Text style={styles.registerTitle}>نیا دکان کھاتہ بنائیں</Text>
                    <Text style={styles.registerSubtitle}>
                      Register New Shop Account (1 Minute Setup)
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>یا موجودہ اکاؤنٹ میں داخل ہوں</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Mobile Phone Input for Existing Owner */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>دکان مالک کا موبائل نمبر (Mobile Number)</Text>
                  <Input
                    placeholder="0300 8765432"
                    value={ownerPhoneInput}
                    onChangeText={(text) => {
                      setOwnerPhoneInput(text);
                      if (ownerPhoneError) setOwnerPhoneError(null);
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                    leftIcon={<Phone size={18} color={colors.neutralMuted} />}
                    error={ownerPhoneError || undefined}
                  />
                </View>

                <Button
                  title="او ٹی پی حاصل کریں (Send Verification OTP)"
                  onPress={handleOwnerPhoneLogin}
                  isLoading={isLoading}
                  size="lg"
                  style={styles.primaryActionBtn}
                />

                {/* Demo Owner Shortcut */}
                <TouchableOpacity
                  style={styles.demoOwnerLink}
                  onPress={handleDemoOwnerLogin}
                  activeOpacity={0.7}
                >
                  <Sparkles size={15} color={colors.accentBlue} style={styles.inlineIcon} />
                  <Text style={styles.demoOwnerLinkText}>
                    ڈیمو دکان مالک لاگ ان کریں (المدینہ زرعی مرکز)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Owner Registration Modal */}
      <OwnerRegisterModal
        visible={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => setIsRegisterModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 220, // generous bottom padding so keyboard never hides content
  },
  brandHeader: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.pillRadius,
    marginBottom: 10,
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
    fontSize: typography.fontSizes.xs,
    color: colors.primaryLight,
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginBottom: 14,
  },

  /* ========================================================================= */
  /* HIGH-CONTRAST ROLE SELECTION CARDS                                       */
  /* ========================================================================= */
  roleCardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  roleCardActive: {
    backgroundColor: colors.primary, // Rich solid green (#0F5132)
    borderWidth: 2.5,
    borderColor: '#0B3D25',
    ...elevation.md,
  },
  roleCardInactive: {
    backgroundColor: colors.cardSurface, // White
    borderWidth: 1.5,
    borderColor: colors.neutralBorder,
    ...elevation.sm,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  roleIconBoxInactive: {
    backgroundColor: colors.primaryLight,
  },
  activeCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.pillRadius,
  },
  activeCheckText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
  },
  inactiveDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.neutralLight,
  },
  roleCardTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.extrabold,
  },
  roleCardTitleActive: {
    color: '#FFFFFF',
  },
  roleCardTitleInactive: {
    color: colors.neutralDark,
  },
  roleCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  roleCardSubtitleActive: {
    color: colors.primaryLight,
    fontWeight: typography.fontWeights.medium,
  },
  roleCardSubtitleInactive: {
    color: colors.neutralMuted,
  },

  /* ========================================================================= */
  /* TAB CONTENT                                                              */
  /* ========================================================================= */
  tabContentContainer: {
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F9F5',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  infoBannerIcon: {
    marginRight: 10,
  },
  infoBannerTextWrap: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  infoBannerSubtitle: {
    fontSize: 11,
    color: colors.neutralDark,
    marginTop: 2,
    lineHeight: 15,
  },
  inputSection: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginBottom: 6,
  },
  primaryActionBtn: {
    marginBottom: 16,
  },
  demoSection: {
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    marginTop: 8,
  },
  demoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
    marginLeft: 6,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  demoChipCode: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.primary,
  },
  demoChipName: {
    fontSize: 10,
    color: colors.neutralDark,
    marginTop: 2,
  },
  registerShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  registerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  registerTextBox: {
    flex: 1,
  },
  registerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  registerSubtitle: {
    fontSize: 11,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutralBorder,
  },
  dividerText: {
    fontSize: 11,
    color: colors.neutralLight,
    paddingHorizontal: 10,
  },
  demoOwnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  inlineIcon: {
    marginRight: 6,
  },
  demoOwnerLinkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentBlue,
  },
});
