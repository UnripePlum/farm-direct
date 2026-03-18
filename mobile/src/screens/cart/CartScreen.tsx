import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { CartItem } from '../../types';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { items, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleRemove = (itemId: string) => {
    Alert.alert('상품 삭제', '장바구니에서 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeItem(itemId) },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    return (
      <View style={styles.cartItem}>
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Ionicons name="leaf" size={24} color={Colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.productId} numberOfLines={1}>상품 {item.product_id.slice(0, 8)}...</Text>
          <View style={styles.itemFooter}>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (item.quantity <= 1) {
                    handleRemove(item.id);
                  } else {
                    updateQuantity(item.id, item.quantity - 1);
                  }
                }}
              >
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <Button title="로그인하기" onPress={() => navigation.navigate('Auth')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>장바구니</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="장바구니를 불러오는 중..." />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={80} color={Colors.border} />
          <Text style={styles.emptyTitle}>장바구니가 비었습니다</Text>
          <Text style={styles.emptySubtitle}>신선한 농산물을 담아보세요</Text>
          <Button title="상품 둘러보기" onPress={() => navigation.navigate('Products')} style={styles.shopButton} />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>상품 수</Text>
              <Text style={styles.summaryValue}>{items.reduce((sum, i) => sum + i.quantity, 0)}개</Text>
            </View>
            <View style={styles.divider} />
            <Button
              title="주문하기"
              onPress={() => navigation.navigate('Checkout')}
              fullWidth
              size="lg"
              style={styles.checkoutButton}
            />
          </View>
        </>
      )}
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
  },
  title: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.bold, color: Colors.text },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.small,
    gap: Spacing.md,
  },
  itemImage: { width: 80, height: 80, borderRadius: BorderRadius.md, backgroundColor: Colors.divider },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1 },
  productId: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.text, marginBottom: Spacing.sm },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.text, minWidth: 24, textAlign: 'center' },
  deleteBtn: { padding: Spacing.xs, alignSelf: 'flex-start' },
  summary: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { fontSize: Fonts.sizes.md, color: Colors.textSecondary },
  summaryValue: { fontSize: Fonts.sizes.md, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  checkoutButton: { marginTop: Spacing.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textLight },
  shopButton: { marginTop: Spacing.md },
});
