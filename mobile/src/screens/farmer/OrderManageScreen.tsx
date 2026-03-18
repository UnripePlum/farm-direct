import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ordersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

const STATUS_TRANSITIONS: Record<string, { label: string; next: OrderStatus }> = {
  pending: { label: '결제 확인', next: 'paid' },
  paid: { label: '준비 시작', next: 'processing' },
  processing: { label: '배송 시작', next: 'shipped' },
  shipped: { label: '배송 완료', next: 'completed' },
};

const STATUS_BADGE_MAP: Record<string, any> = {
  pending: 'warning',
  paid: 'info',
  processing: 'info',
  shipped: 'info',
  completed: 'success',
  cancelled: 'error',
};

export const OrderManageScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // handle silently
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleStatusUpdate = async (order: Order) => {
    const transition = STATUS_TRANSITIONS[order.status];
    if (!transition) return;
    Alert.alert('상태 변경', `주문을 "${transition.label}" 처리하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          try {
            await ordersApi.updateOrderStatus(order.id, transition.next);
            loadOrders();
          } catch {
            Alert.alert('오류', '상태 변경에 실패했습니다');
          }
        },
      },
    ]);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const transition = STATUS_TRANSITIONS[item.status];
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>주문 #{item.id.slice(0, 8)}</Text>
          <Badge label={ORDER_STATUS_LABELS[item.status] ?? item.status} variant={STATUS_BADGE_MAP[item.status]} />
        </View>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        <View style={styles.shippingInfo}>
          <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.shippingText}>{item.shipping_name} · {item.shipping_phone}</Text>
        </View>
        <View style={styles.shippingInfo}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.shippingText} numberOfLines={1}>{item.shipping_address}</Text>
        </View>
        <View style={styles.divider} />
        {item.items.map((orderItem) => (
          <View key={orderItem.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>상품 #{(orderItem.product_id ?? '').slice(0, 8)}</Text>
            <Text style={styles.itemDetail}>{orderItem.quantity}개 x {formatPrice(orderItem.price_at_purchase)}</Text>
          </View>
        ))}
        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>{formatPrice(item.total_price)}</Text>
          {transition && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate(item)}>
              <Text style={styles.actionBtnText}>{transition.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) return <LoadingSpinner fullScreen message="주문을 불러오는 중..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>주문 관리</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>주문이 없습니다</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
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
  title: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderNumber: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.text },
  orderDate: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  shippingInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  shippingText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  itemName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.text },
  itemDetail: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  totalAmount: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  actionBtnText: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: Fonts.weights.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.lg },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
});
