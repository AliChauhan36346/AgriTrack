import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface PhoneAuthScreenProps {
  onBackToRole?: () => void;
  onSuccess?: () => void;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({
  onBackToRole,
  onSuccess,
}) => {
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const loginAs = useAuthStore((state) => state.loginAs);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (localError) setLocalError(null);

    // Only allow digits
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Paste handling
      const digits = cleaned.split('').slice(0, 6);
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      if (digits.length === 6) {
        loginAs(selectedRole);
        onSuccess?.();
      } else {
        inputRefs.current[Math.min(5, digits.length - 1)]?.focus();
      }
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (cleaned && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        loginAs(selectedRole);
        onSuccess?.();
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setLocalError('Please enter the full 6-digit code');
      return;
    }

    loginAs(selectedRole);
    onSuccess?.();
  };

  const handleResend = () => {
    setTimer(45);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />

      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToRole}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to role selection"
          >
            <ArrowLeft size={22} color={colors.neutralDark} />
          </TouchableOpacity>
        </View>

        {/* Content Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, elevation.sm]}>
            <ShieldCheck size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter 6-Digit OTP</Text>
          <Text style={styles.subtitle}>
            We have sent a verification code to{' '}
            <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
          </Text>
        </View>

        {/* 6-Digit Boxes with touch target >= 48dp */}
        <View style={styles.otpGrid}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                localError || authError ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
              autoFocus={index === 0}
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          ))}
        </View>

        {/* Error message */}
        {(localError || authError) && (
          <Text style={styles.errorMessage}>{localError || authError}</Text>
        )}

        {/* Resend link */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              style={styles.resendBtn}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={colors.primary} style={styles.resendIcon} />
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Verify & Enter Portal"
            onPress={handleVerify}
            isLoading={isLoading}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  navBar: {
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.cardSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  phoneHighlight: {
    color: colors.neutralDark,
    fontWeight: typography.fontWeights.bold,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56, // >= 48dp touch target
    backgroundColor: colors.cardSurface,
    borderWidth: 1.5,
    borderColor: colors.neutralBorder,
    borderRadius: 12,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F7FCF9',
  },
  otpBoxError: {
    borderColor: colors.dangerRed,
    backgroundColor: colors.dangerRedLight,
  },
  errorMessage: {
    color: colors.dangerRed,
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: typography.fontWeights.medium,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralLight,
  },
  timerCount: {
    color: colors.neutralDark,
    fontWeight: typography.fontWeights.bold,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resendIcon: {
    marginRight: 6,
  },
  resendText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  buttonWrapper: {
    marginTop: 'auto',
    marginBottom: 24,
  },
});
