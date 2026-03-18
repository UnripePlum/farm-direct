import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatPrice } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  horizontal?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  horizontal = false,
}) => {
  const imageUri = product.photos?.[0];

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.horizontalImageWrapper}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.horizontalImage} resizeMode="cover" />
          ) : (
            <View style={[styles.horizontalImage, styles.imagePlaceholder]}>
              <Ionicons name="leaf" size={28} color={Colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.region && (
            <Text style={styles.regionText} numberOfLines={1}>{product.region}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="leaf" size={40} color={Colors.primary} />
          </View>
        )}
        {product.ai_suggested_price != null && product.ai_suggested_price < product.price && (
          <View style={styles.saleTag}>
            <Text style={styles.saleText}>AI추천가</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        {product.region && (
          <Text style={styles.regionText} numberOfLines={1}>{product.region}</Text>
        )}
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>
          {onAddToCart && (
            <TouchableOpacity style={styles.cartButton} onPress={onAddToCart}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
    overflow: 'hidden',
    width: 170,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.divider,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleTag: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  saleText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.white,
    fontWeight: Fonts.weights.bold,
  },
  content: {
    padding: Spacing.md,
  },
  regionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  productName: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  cartButton: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Horizontal styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  horizontalImageWrapper: {
    position: 'relative',
  },
  horizontalImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.divider,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
});
