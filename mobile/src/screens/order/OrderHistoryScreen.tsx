import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { ordersApi } from '../../api/orders';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

const STATUS_BADGE_MAP: Record<string, any> = {
  pending: 'warning',
  paid: 'info',
  processing: 'info',
  shipped: 'info',
  completed: 'success',
  cancelled: 'error',
};

export const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.85}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>주문 #{item.id.slice(0, 8)}</Text>
        <Badge label={ORDER_STATUS_LABELS[item.status] ?? item.status} variant={STATUS_BADGE_MAP[item.status]} />
      </View>
      <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
      <View style={styles.divider} />
      {item.items.slice(0, 2).map((orderItem) => (
        <View key={orderItem.id} style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>상품 #{(orderItem.product_id ?? '').slice(0, 8)}</Text>
          <Text style={styles.itemQty}>{orderItem.quantity}개</Text>
          <Text style={styles.itemPrice}>{formatPrice(orderItem.price_at_purchase * orderItem.quantity)}</Text>
        </View>
      ))}
      {item.items.length > 2 && (
        <Text style={styles.moreItems}>외 {item.items.length - 2}개 상품</Text>
      )}
      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>총 {formatPrice(item.total_price)}</Text>
        <View style={styles.actions}>
          {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() =>
                navigation.navigate('WriteReview', {
                  orderId: item.id,
                  productId: item.items[0]?.product_id,
                })
              }
            >
              <Text style={styles.reviewBtnText}>리뷰 작성</Text>
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                Alert.alert('주문 취소', '정말 주문을 취소하시겠습니까?', [
                  { text: '아니오', style: 'cancel' },
                  {
                    text: '취소하기',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await ordersApi.updateOrderStatus(item.id, 'cancelled');
                        loadOrders();
                      } catch {
                        Alert.alert('오류', '주문 취소에 실패했습니다');
                      }
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.cancelBtnText}>주문 취소</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingSpinner fullScreen message="주문 내역을 불러오는 중..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>주문 내역</Text>
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
            <Text style={styles.emptyTitle}>주문 내역이 없습니다</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
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
  orderDate: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  itemName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.text },
  itemQty: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginHorizontal: Spacing.sm },
  itemPrice: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium, color: Colors.text },
  moreItems: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginTop: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  totalLabel: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  reviewBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary },
  reviewBtnText: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: Fonts.weights.semibold },
  cancelBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.error },
  cancelBtnText: { fontSize: Fonts.sizes.sm, color: Colors.error },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.lg },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
});
