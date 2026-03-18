import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Spacing } from '../../theme';
import { ProductCard } from '../product/ProductCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';

export const RecommendedProducts: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data, isLoading } = useProducts({ page: 1, page_size: 8 });
  const { addToCart } = useCartStore();

  const products = data?.items ?? [];

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
    } catch {
      // handle error silently
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 추천</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Text style={styles.seeAll}>전체보기</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              onAddToCart={() => handleAddToCart(product.id)}
            />
          ))}
          {products.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>추천 상품이 없습니다</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  seeAll: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.weights.medium,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  empty: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
  },
});
