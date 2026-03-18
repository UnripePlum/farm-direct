import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { productsApi } from '../../api/products';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useQueryClient } from '@tanstack/react-query';

export const ProductManageScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { data, isLoading } = useProducts();
  const queryClient = useQueryClient();
  const products = data?.items ?? [];

  const handleDelete = (product: Product) => {
    Alert.alert('상품 삭제', `${product.name}을(를) 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await productsApi.deleteProduct(product.id);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          } catch {
            Alert.alert('오류', '상품 삭제에 실패했습니다');
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUri = item.photos?.[0];
    return (
      <View style={styles.productCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Ionicons name="leaf" size={28} color={Colors.primary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.productMeta}>
            <Badge label={item.is_active ? '판매중' : '판매중지'} variant={item.is_active ? 'success' : 'error'} />
            <Text style={styles.stockText}>재고 {item.stock}</Text>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => Alert.alert('준비 중', '상품 수정 기능은 곧 제공될 예정입니다')}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>상품 관리</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="상품을 불러오는 중..." />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>등록된 상품이 없습니다</Text>
              <Text style={styles.emptySubtitle}>첫 상품을 등록해보세요</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  productImage: { width: 90, height: 90, backgroundColor: Colors.divider },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, padding: Spacing.md },
  productName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.text, marginBottom: 4 },
  productPrice: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.bold, marginBottom: Spacing.xs },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  stockText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary },
  productActions: { padding: Spacing.sm, justifyContent: 'space-around' },
  editBtn: { padding: Spacing.xs },
  deleteBtn: { padding: Spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textLight },
});
