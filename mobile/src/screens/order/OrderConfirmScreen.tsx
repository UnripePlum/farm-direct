import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ordersApi } from '../../api/orders';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

export const OrderConfirmScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrder(orderId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading || !order) {
    return <LoadingSpinner fullScreen message="주문 정보를 확인하는 중..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>주문이 완료되었습니다!</Text>
          <Text style={styles.orderNumber}>주문번호: {order.id.slice(0, 8)}</Text>
        </View>

        {/* Order Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상태</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{ORDER_STATUS_LABELS[order.status]}</Text>
            <Text style={styles.statusDate}>{formatDate(order.created_at)}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemDot} />
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>상품 #{(item.product_id ?? '').slice(0, 8)}</Text>
                <Text style={styles.itemDetail}>{item.quantity}개 x {formatPrice(item.price_at_purchase)}</Text>
              </View>
              <Text style={styles.itemSubtotal}>{formatPrice(item.price_at_purchase * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송 정보</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{order.shipping_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{order.shipping_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{order.shipping_address}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 정보</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>총 결제금액</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total_price)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="주문 내역 보기"
          variant="outline"
          onPress={() => navigation.navigate('OrderHistory')}
          style={styles.historyBtn}
        />
        <Button
          title="쇼핑 계속하기"
          onPress={() => navigation.navigate('Home')}
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  successHeader: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xl,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  orderNumber: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text, marginBottom: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  statusText: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.text, fontWeight: Fonts.weights.medium },
  statusDate: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  itemContent: { flex: 1 },
  itemName: { fontSize: Fonts.sizes.md, color: Colors.text, fontWeight: Fonts.weights.medium },
  itemDetail: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  itemSubtotal: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoText: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.text, lineHeight: 22 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  paymentLabel: { fontSize: Fonts.sizes.md, color: Colors.textSecondary },
  paymentValue: { fontSize: Fonts.sizes.md, color: Colors.text },
  totalLabel: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text },
  totalValue: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.extrabold, color: Colors.primary },
  footer: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  historyBtn: { flex: 1 },
  continueBtn: { flex: 1 },
});
