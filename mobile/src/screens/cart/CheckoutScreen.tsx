import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { ordersApi } from '../../api/orders';
import { paymentsApi } from '../../api/payments';
import { paymentProvider } from '../../services/payment';
import { PAYMENT_METHODS } from '../../utils/constants';

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [form, setForm] = useState({
    shipping_name: user?.name ?? '',
    shipping_phone: user?.phone ?? '',
    shipping_address: user?.address ?? '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.shipping_name) newErrors.shipping_name = '수령인을 입력해주세요';
    if (!form.shipping_phone) newErrors.shipping_phone = '연락처를 입력해주세요';
    if (!form.shipping_address) newErrors.shipping_address = '배송 주소를 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!validate()) return;
    if (!items.length) {
      Alert.alert('오류', '장바구니가 비어있습니다');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create order on backend
      const order = await ordersApi.createOrder({
        shipping_name: form.shipping_name,
        shipping_phone: form.shipping_phone,
        shipping_address: form.shipping_address,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });

      // 2. Prepare payment via backend
      const prepared = await paymentsApi.preparePayment({
        order_id: order.id,
        method: selectedPayment,
      });

      // 3. Request payment via payment provider (dummy or real PG)
      const paymentResult = await paymentProvider.requestPayment({
        merchantUid: prepared.merchant_uid,
        amount: prepared.amount,
        orderName: `FarmDirect 주문 ${order.id.slice(0, 8)}`,
        buyerName: form.shipping_name,
        buyerPhone: form.shipping_phone,
      });

      if (!paymentResult.success) {
        Alert.alert('결제 실패', '결제가 완료되지 않았습니다');
        return;
      }

      // 4. Confirm payment on backend
      await paymentsApi.confirmPayment({
        imp_uid: paymentResult.imp_uid,
        merchant_uid: paymentResult.merchant_uid,
        order_id: order.id,
      });

      navigation.replace('OrderConfirm', { orderId: order.id });
    } catch (err: any) {
      Alert.alert('주문 실패', err?.response?.data?.detail ?? '다시 시도해주세요');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView testID="screen-checkout" style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>주문/결제</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order Items Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주문 상품 ({items.length}개)</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>상품 {item.product_id.slice(0, 8)}...</Text>
                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
              </View>
            ))}
          </View>

          {/* Shipping Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>배송 정보</Text>
            <Input
              label="수령인"
              placeholder="수령인 이름"
              value={form.shipping_name}
              onChangeText={(v) => updateField('shipping_name', v)}
              error={errors.shipping_name}
              leftIcon="person-outline"
              testID="checkout-name-input"
            />
            <Input
              label="연락처"
              placeholder="010-0000-0000"
              value={form.shipping_phone}
              onChangeText={(v) => updateField('shipping_phone', v)}
              keyboardType="phone-pad"
              error={errors.shipping_phone}
              leftIcon="call-outline"
              testID="checkout-phone-input"
            />
            <Input
              label="배송 주소"
              placeholder="도로명 주소 또는 지번 주소"
              value={form.shipping_address}
              onChangeText={(v) => updateField('shipping_address', v)}
              error={errors.shipping_address}
              leftIcon="location-outline"
              testID="checkout-address-input"
            />
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>결제 수단</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.paymentOption, selectedPayment === method.id && styles.paymentSelected]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={22}
                    color={selectedPayment === method.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.paymentLabel, selectedPayment === method.id && styles.paymentLabelSelected]}>
                    {method.label}
                  </Text>
                  {selectedPayment === method.id && (
                    <View style={styles.selectedCheck}>
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="결제하기"
            onPress={handleOrder}
            loading={isLoading}
            fullWidth
            size="lg"
            testID="checkout-pay-button"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  scrollContent: { paddingBottom: Spacing.xxxl },
  section: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  orderItemName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.text },
  orderItemQty: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, marginHorizontal: Spacing.sm },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  paymentOption: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  paymentSelected: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  paymentLabel: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, flex: 1 },
  paymentLabelSelected: { color: Colors.primary, fontWeight: Fonts.weights.semibold },
  selectedCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
