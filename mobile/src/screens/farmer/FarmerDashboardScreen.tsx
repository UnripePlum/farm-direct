import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { SalesStats } from '../../components/farmer/SalesStats';
import { DemandChart } from '../../components/farmer/DemandChart';
import { PriceSuggestionCard } from '../../components/farmer/PriceSuggestion';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { aiApi } from '../../api/ai';
import { ordersApi } from '../../api/orders';
import { PriceSuggestion, DemandForecast, Order } from '../../types';

export const FarmerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout } = useAuthStore();
  const [priceSuggestions, setPriceSuggestions] = useState<PriceSuggestion[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState({ totalSales: 0, totalOrders: 0, pendingOrders: 0, averageRating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [forecasts, ordersResponse] = await Promise.all([
        aiApi.getDemandForecast().catch(() => []),
        ordersApi.getOrders(),
      ]);
      setDemandForecasts(forecasts);

      const orderList = Array.isArray(ordersResponse) ? ordersResponse : [];
      setRecentOrders(orderList.slice(0, 5));
      const totalSales = orderList.reduce((sum: number, o: Order) => sum + (o.total_price || 0), 0);
      const pendingCount = orderList.filter((o: Order) => o.status === 'pending' || o.status === 'paid').length;
      setSalesData({
        totalSales,
        totalOrders: orderList.length,
        pendingOrders: pendingCount,
        averageRating: 0,
      });
    } catch {
      // handle silently
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const quickActions = [
    { label: '상품 관리', icon: 'bag-outline', color: Colors.primary, bg: '#DCFCE7', onPress: () => navigation.navigate('ProductManage') },
    { label: '주문 관리', icon: 'receipt-outline', color: '#3B82F6', bg: '#DBEAFE', onPress: () => navigation.navigate('OrderManage') },
    { label: '상품 추가', icon: 'add-circle-outline', color: Colors.secondary, bg: '#FEF3C7', onPress: () => navigation.navigate('AddProduct') },
    { label: '정산 내역', icon: 'card-outline', color: Colors.success, bg: '#D1FAE5', onPress: () => Alert.alert('준비 중', '이 기능은 곧 제공될 예정입니다') },
  ];

  if (isLoading) return <LoadingSpinner fullScreen message="대시보드를 불러오는 중..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>농부 대시보드</Text>
          <Text style={styles.farmName}>{user?.name}님의 농장</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {/* Stats */}
        <SalesStats totalSales={salesData.totalSales} totalOrders={salesData.totalOrders} pendingOrders={salesData.pendingOrders} averageRating={salesData.averageRating} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity key={i} style={styles.quickItem} onPress={action.onPress} activeOpacity={0.7}>
                <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={26} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Demand Chart */}
        <View style={styles.card}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.secondary} />
            <Text style={styles.aiTitle}>AI 수요 예측</Text>
          </View>
          <DemandChart forecasts={demandForecasts} />
        </View>

        {/* Price Suggestions */}
        {priceSuggestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiLabelRow}>
                <Ionicons name="sparkles" size={14} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>AI 가격 추천</Text>
              </View>
              <Text style={styles.suggestionCount}>{priceSuggestions.length}개</Text>
            </View>
            {priceSuggestions.slice(0, 3).map((suggestion) => (
              <PriceSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApplied={loadData}
              />
            ))}
          </View>
        )}

        {/* Recent Orders (real data) */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 주문</Text>
            {recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('OrderManage')}
              >
                <View style={[styles.activityIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name="bag-check-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{order.shipping_name} - {formatPrice(order.total_price)}</Text>
                  <Text style={styles.activityTime}>{order.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  greeting: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  farmName: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { padding: Spacing.xs },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text, marginBottom: Spacing.md },
  aiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  suggestionCount: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  quickGrid: { flexDirection: 'row', gap: Spacing.md },
  quickItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: Fonts.sizes.xs, color: Colors.text, fontWeight: Fonts.weights.medium, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
    overflow: 'hidden',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  aiTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: Fonts.sizes.sm, color: Colors.text, fontWeight: Fonts.weights.medium },
  activityTime: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
