import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Store, User, Phone, MapPin, Mail, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

interface OwnerRegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerRegisterModal: React.FC<OwnerRegisterModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const registerShopOwner = useAuthStore((state) => state.registerShopOwner);

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!shopName.trim()) {
      newErrors.shopName = 'دکان کا نام درج کریں (Shop name is required)';
    }
    if (!ownerName.trim()) {
      newErrors.ownerName = 'مالک کا نام درج کریں (Owner name is required)';
    }
    if (!phone.trim() || phone.trim().length < 10) {
      newErrors.phone = 'درست موبائل نمبر درج کریں (Valid mobile number required)';
    }
    if (!city.trim()) {
      newErrors.city = 'شہر / ضلع درج کریں (City is required)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    registerShopOwner({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim(),
    });

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={[styles.modalCard, elevation.lg]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>نیا دکان کھاتہ بنائیں</Text>
              <Text style={styles.modalSubtitle}>Create Shop Owner Account</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.neutralDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContainer}
          >
            {/* Shop Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>دکان یا کاروبار کا نام (Shop / Business Name) *</Text>
              <Input
                placeholder="مثال: المدینہ زرعی مرکز (Al-Madina Zari Markaz)"
                value={shopName}
                onChangeText={(val) => {
                  setShopName(val);
                  if (errors.shopName) setErrors((prev) => ({ ...prev, shopName: '' }));
                }}
                leftIcon={<Store size={18} color={colors.neutralMuted} />}
                error={errors.shopName}
              />
            </View>

            {/* Owner Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>مالک کا پورا نام (Owner Full Name) *</Text>
              <Input
                placeholder="مثال: حاجی عبد الرشید (Haji Abdul Rasheed)"
                value={ownerName}
                onChangeText={(val) => {
                  setOwnerName(val);
                  if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: '' }));
                }}
                leftIcon={<User size={18} color={colors.neutralMuted} />}
                error={errors.ownerName}
              />
            </View>

            {/* Mobile Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>موبائل نمبر (Mobile Phone) *</Text>
              <Input
                placeholder="0300 1234567"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                keyboardType="phone-pad"
                leftIcon={<Phone size={18} color={colors.neutralMuted} />}
                error={errors.phone}
              />
            </View>

            {/* City / District */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>شہر / ضلع (City / District) *</Text>
              <Input
                placeholder="مثال: ملتان، فیصل آباد، ساہیوال، خانیوال"
                value={city}
                onChangeText={(val) => {
                  setCity(val);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                leftIcon={<MapPin size={18} color={colors.neutralMuted} />}
                error={errors.city}
              />
            </View>

            {/* Email (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ای میل پتہ (Email Address - اختیاری)</Text>
              <Input
                placeholder="owner@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                leftIcon={<Mail size={18} color={colors.neutralMuted} />}
              />
            </View>

            {/* Submit Button */}
            <Button
              title="اکاؤنٹ بنائیں اور لاگ ان کریں"
              onPress={handleRegister}
              isLoading={isSubmitting}
              size="lg"
              rightIcon={<ArrowRight size={20} color={colors.cardSurface} />}
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  modalSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutralDivider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginBottom: 6,
  },
  submitBtn: {
    marginTop: 12,
  },
});
