import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductFilter } from '../../components/product/ProductFilter';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(route.params?.categoryId ?? null);
  const [isOrganic, setIsOrganic] = useState(false);
  const [sort, setSort] = useState('-created_at');
  const [showFilter, setShowFilter] = useState(false);
  const { addToCart } = useCartStore();

  const { data, isLoading, refetch, isRefetching } = useProducts({
    search: search || undefined,
    category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
  });

  const products = data?.items ?? [];

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
    } catch {
      // handle silently
    }
  };

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productWrapper}>
        <ProductCard
          product={item}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          onAddToCart={() => handleAddToCart(item.id)}
        />
      </View>
    ),
    [navigation]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>상품이 없습니다</Text>
      <Text style={styles.emptySubtitle}>검색 조건을 변경해보세요</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>농산물 마켓</Text>
        <TouchableOpacity style={styles.filterIcon} onPress={() => setShowFilter(!showFilter)}>
          <Ionicons name="options-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="상품 검색..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showFilter && (
        <ProductFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onOrganicToggle={setIsOrganic}
          isOrganic={isOrganic}
          onSortChange={setSort}
          currentSort={sort}
        />
      )}

      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {isLoading ? '로딩 중...' : `${data?.total ?? 0}개의 상품`}
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="상품을 불러오는 중..." />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
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
  },
  title: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.bold, color: Colors.text },
  filterIcon: { padding: Spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  resultInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultCount: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  productWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textLight },
});
