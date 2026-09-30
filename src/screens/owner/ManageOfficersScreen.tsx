import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import {
  UserPlus,
  Users,
  Copy,
  Share2,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Battery,
  ShieldAlert,
  X,
  Store,
  KeyRound,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { FieldOfficer } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { elevation } from '../../theme/elevation';

export const ManageOfficersScreen: React.FC = () => {
  const currentOwner = useAuthStore((state) => state.currentOwner);
  const registeredOfficers = useAuthStore((state) => state.registeredOfficers);
  const addFieldOfficer = useAuthStore((state) => state.addFieldOfficer);
  const deleteFieldOfficer = useAuthStore((state) => state.deleteFieldOfficer);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [createdCodeModal, setCreatedCodeModal] = useState<{
    officer: FieldOfficer;
    code: string;
  } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [territory, setTerritory] = useState('');
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'آفیسر کا نام درج کریں (Officer name required)';
    if (!phone.trim() || phone.trim().length < 10)
      errs.phone = 'درست موبائل نمبر درج کریں (Valid phone required)';
    if (!territory.trim())
      errs.territory = 'متعلقہ علاقہ / تحصیل درج کریں (Territory required)';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOfficer = () => {
    if (!validate()) return;

    const result = addFieldOfficer({
      fullName: fullName.trim(),
      phone: phone.trim(),
      assignedTerritory: territory.trim(),
      email: email.trim() || undefined,
    });

    // Reset form
    setFullName('');
    setPhone('');
    setTerritory('');
    setEmail('');
    setFormErrors({});
    setIsAddModalVisible(false);

    // Show generated code celebration modal
    setCreatedCodeModal({ officer: result.officer, code: result.accessCode });
  };

  const handleShareCode = async (officerName: string, accessCode: string) => {
    const shopName = currentOwner?.shopName || 'AgriRoute Farm Shop';
    const message = `السلام علیکم ${officerName}!\nآپ کو ${shopName} نے AgriRoute ایپ میں شامل کر لیا ہے۔\n\nآپ کا لاگ ان رسائی کوڈ یہ ہے:\n🔑 کوڈ: ${accessCode}\n\nایپ کھولیں، فیلڈ آفیسر منتخب کریں اور یہ کوڈ درج کر کے اپنی ڈیوٹی / شفت شروع کریں۔`;

    try {
      await Share.share({
        message,
        title: `AgriRoute Login Code for ${officerName}`,
      });
    } catch {
      // Ignored
    }
  };

  const handleDelete = (officer: FieldOfficer) => {
    Alert.alert(
      'آفیسر کو ہٹائیں (Remove Officer)',
      `کیا آپ واقعی ${officer.fullName} کو اپنی لسٹ سے ہٹانا چاہتے ہیں؟`,
      [
        { text: 'منسوخ (Cancel)', style: 'cancel' },
        {
          text: 'ہٹائیں (Remove)',
          style: 'destructive',
          onPress: () => deleteFieldOfficer(officer.id),
        },
      ]
    );
  };

  const renderOfficerItem = ({ item }: { item: FieldOfficer }) => {
    return (
      <View style={[styles.officerCard, elevation.sm]}>
        <View style={styles.cardHeader}>
          <View style={styles.officerInfo}>
            <Text style={styles.officerName}>{item.fullName}</Text>
            <View style={styles.territoryRow}>
              <MapPin size={13} color={colors.neutralMuted} style={styles.inlineIcon} />
              <Text style={styles.territoryText}>{item.assignedTerritory}</Text>
            </View>
          </View>
          <StatusBadge status={item.currentStatus || 'offline'} />
        </View>

        {/* Access Code Highlight Section */}
        <View style={styles.codeBanner}>
          <View style={styles.codeTextGroup}>
            <View style={styles.codeLabelRow}>
              <KeyRound size={14} color={colors.primary} />
              <Text style={styles.codeLabel}>لاگ ان رسائی کوڈ (Access Code)</Text>
            </View>
            <Text style={styles.codeValue}>{item.accessCode || 'FO-101'}</Text>
          </View>

          <TouchableOpacity
            style={styles.shareIconButton}
            onPress={() => handleShareCode(item.fullName, item.accessCode || 'FO-101')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share login code"
          >
            <Share2 size={16} color={colors.primary} />
            <Text style={styles.shareIconText}>شیئر کریں</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Meta */}
        <View style={styles.cardFooter}>
          <View style={styles.phoneMeta}>
            <Phone size={13} color={colors.neutralLight} style={styles.inlineIcon} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>

          <View style={styles.batteryMeta}>
            <Battery size={14} color={colors.neutralLight} style={styles.inlineIcon} />
            <Text style={styles.batteryText}>{item.batteryLevel}% بیٹری</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Delete officer"
          >
            <Trash2 size={15} color={colors.dangerRed} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Shop Banner */}
      <View style={styles.shopBanner}>
        <View style={styles.shopIconBox}>
          <Store size={22} color={colors.primary} />
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopTitle}>
            {currentOwner?.shopName || 'المدینہ زرعی مرکز (Al-Madina Zari Markaz)'}
          </Text>
          <Text style={styles.shopSubtitle}>
            مالک: {currentOwner?.ownerName || 'Haji Abdul Rasheed'} • {currentOwner?.city || 'ملتان'}
          </Text>
        </View>
      </View>

      {/* Action Header */}
      <View style={styles.listHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>فیلڈ آفیسرز کی فہرست (Field Officers)</Text>
          <Text style={styles.sectionSubtitle}>
            کل آفیسرز: {registeredOfficers.length} | کوڈ سے فوری لاگ ان
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color={colors.cardSurface} style={styles.addBtnIcon} />
          <Text style={styles.addBtnText}>+ نیا آفیسر شامل کریں</Text>
        </TouchableOpacity>
      </View>

      {/* Officers List */}
      <FlatList
        data={registeredOfficers}
        keyExtractor={(item) => item.id}
        renderItem={renderOfficerItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={colors.neutralLight} />
            <Text style={styles.emptyTitle}>کوئی فیلڈ آفیسر شامل نہیں ہے</Text>
            <Text style={styles.emptySubtitle}>
              اوپر والے بٹن پر کلک کر کے نیا فیلڈ آفیسر اور اس کا کوڈ بنائیں
            </Text>
          </View>
        }
      />

      {/* Modal 1: Add Field Officer */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, elevation.lg]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeading}>نیا فیلڈ آفیسر شامل کریں</Text>
                <Text style={styles.modalSubheading}>
                  سیستم خود بخود منفرد رسائی کوڈ (Access Code) تیار کرے گا
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.neutralDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>آفیسر کا پورا نام (Full Name) *</Text>
                <Input
                  placeholder="مثال: اسد اللہ (Asad Ullah)"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (formErrors.fullName)
                      setFormErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  error={formErrors.fullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>موبائل نمبر (Mobile Phone) *</Text>
                <Input
                  placeholder="0304 1234567"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  keyboardType="phone-pad"
                  error={formErrors.phone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>متعلقہ علاقہ / زون (Assigned Territory) *</Text>
                <Input
                  placeholder="مثال: خانیوال کپاس زون، وہاڑی گندم سرکل"
                  value={territory}
                  onChangeText={(val) => {
                    setTerritory(val);
                    if (formErrors.territory)
                      setFormErrors((prev) => ({ ...prev, territory: '' }));
                  }}
                  error={formErrors.territory}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ای میل پتہ (Email - اختیاری)</Text>
                <Input
                  placeholder="officer@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              <Button
                title="کوڈ تیار کریں اور محفوظ کریں (Generate Code & Save)"
                onPress={handleCreateOfficer}
                size="lg"
                style={styles.submitModalBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Generated Code Celebration & Share */}
      <Modal
        visible={!!createdCodeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreatedCodeModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successCard, elevation.lg]}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color={colors.primary} />
            </View>

            <Text style={styles.successHeading}>نیا فیلڈ آفیسر کامیابی سے شامل ہو گیا!</Text>
            <Text style={styles.successSubheading}>
              {createdCodeModal?.officer.fullName} کے لیے لاگ ان کوڈ:
            </Text>

            {/* Huge Code Display Box */}
            <View style={styles.hugeCodeBox}>
              <Text style={styles.hugeCodeText}>{createdCodeModal?.code}</Text>
            </View>

            <Text style={styles.codeInstructions}>
              یہ کوڈ آفیسر کو بھیجیں۔ آفیسر ایپ میں یہ کوڈ درج کر کے بغیر پاسورڈ فوری لاگ ان کر سکے گا۔
            </Text>

            <Button
              title="واٹس ایپ یا ایس ایم ایس پر شیئر کریں (Share via WhatsApp)"
              onPress={() => {
                if (createdCodeModal) {
                  handleShareCode(createdCodeModal.officer.fullName, createdCodeModal.code);
                }
              }}
              size="lg"
              icon={<Share2 size={18} color={colors.cardSurface} />}
              style={styles.shareCodeBtn}
            />

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setCreatedCodeModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.doneBtnText}>مکمل (Done)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  shopIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  shopSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: spacing.pillRadius,
  },
  addBtnIcon: {
    marginRight: 6,
  },
  addBtnText: {
    color: colors.cardSurface,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  officerCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: spacing.cardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  officerInfo: {
    flex: 1,
    marginRight: 8,
  },
  officerName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  territoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inlineIcon: {
    marginRight: 4,
  },
  territoryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  codeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F9F5',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  codeTextGroup: {
    flex: 1,
  },
  codeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  codeLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    marginLeft: 4,
  },
  codeValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.neutralDark,
    letterSpacing: 2,
  },
  shareIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.pillRadius,
  },
  shareIconText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutralDivider,
    paddingTop: 10,
  },
  phoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  phoneText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  batteryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  batteryText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },
  modalHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
  },
  modalSubheading: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutralDivider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutralDark,
    marginBottom: 6,
  },
  submitModalBtn: {
    marginTop: 10,
  },
  successCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralDark,
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutralMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  hugeCodeBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginVertical: 16,
  },
  hugeCodeText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  codeInstructions: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutralDark,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  shareCodeBtn: {
    width: '100%',
    marginBottom: 10,
  },
  doneBtn: {
    paddingVertical: 10,
  },
  doneBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutralMuted,
  },
});
