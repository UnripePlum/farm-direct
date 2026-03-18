import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import { AIPriceTag } from '../../components/product/AIPriceTag';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useProduct } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { reviewsApi } from '../../api/reviews';
import { Review } from '../../types';
import { formatPrice, formatDate, truncateText } from '../../utils/formatters';
import { useQuery } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { productId } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { data: reviews } = useQuery({
    queryKey: ['productReviews', productId],
    queryFn: () => reviewsApi.getProductReviews(productId),
    enabled: !!productId,
  });
  const { addToCart } = useCartStore();

  const reviewList = reviews ?? [];

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name} - ${formatPrice(product.price)}\nFarmDirect에서 신선한 농산물을 만나보세요!`,
      });
    } catch {
      // share cancelled or failed
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      Alert.alert('장바구니 추가', `${product.name}이(가) 장바구니에 추가되었습니다`, [
        { text: '계속 쇼핑', style: 'cancel' },
        { text: '장바구니 보기', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch {
      Alert.alert('오류', '장바구니 추가에 실패했습니다');
    }
  };

  if (isLoading || !product) {
    return <LoadingSpinner fullScreen message="상품 정보를 불러오는 중..." />;
  }

  const photos = product.photos ?? [];
  const description = product.description ?? '';

  return (
    <SafeAreaView testID="screen-product-detail" style={styles.container} edges={['bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity testID="back-button" style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity testID="share-button" style={styles.navButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="bag-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {photos.length > 0 ? (
              photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.productImage} resizeMode="cover" />
              ))
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <Ionicons name="leaf" size={80} color={Colors.primary} />
              </View>
            )}
          </ScrollView>
          {photos.length > 1 && (
            <View style={styles.imageDots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.imageDot, i === activeImageIndex && styles.imageDotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            {product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
              </View>
            )}
            {!product.is_active && (
              <View style={[styles.categoryBadge, { backgroundColor: Colors.error }]}>
                <Text style={styles.categoryBadgeText}>비활성</Text>
              </View>
            )}
          </View>

          {/* Title & Price */}
          <Text testID="product-name-text" style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text testID="price-text" style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          {/* AI Price Suggestion */}
          {product.ai_suggested_price != null && (
            <View style={styles.aiSection}>
              <AIPriceTag
                currentPrice={product.price}
                suggestedPrice={product.ai_suggested_price}
                confidence={0.87}
              />
            </View>
          )}

          {/* Region Info */}
          {product.region && (
            <View style={styles.regionCard}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.regionText}>{product.region}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>상품 정보</Text>
            <View style={styles.detailGrid}>
              {[
                { label: '재고', value: `${product.stock}` },
                { label: '지역', value: product.region ?? '미정' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          {description.length > 0 && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>상품 설명</Text>
              <Text style={styles.description}>
                {showFullDesc ? description : truncateText(description, 150)}
              </Text>
              {description.length > 150 && (
                <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                  <Text style={styles.showMore}>{showFullDesc ? '접기' : '더보기'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Reviews */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>리뷰 ({reviewList.length})</Text>
            </View>
            {reviewList.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewAvatar}>
                    <Ionicons name="person" size={14} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
                {review.text && <Text style={styles.reviewComment}>{review.text}</Text>}
              </View>
            ))}
            {reviewList.length === 0 && (
              <Text style={styles.noReview}>아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
          <Button
            title="장바구니"
            variant="outline"
            onPress={handleAddToCart}
            disabled={!product.is_active || product.stock === 0}
            style={styles.cartBtn}
            testID="add-to-cart-button"
          />
          <Button
            title={`${formatPrice(product.price * quantity)} 구매`}
            onPress={() => {
              handleAddToCart();
              navigation.navigate('Checkout');
            }}
            disabled={!product.is_active || product.stock === 0}
            style={styles.buyBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  navActions: { flexDirection: 'row', gap: Spacing.sm },
  imageContainer: { position: 'relative' },
  productImage: { width, height: 320, backgroundColor: Colors.divider },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageDots: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  imageDotActive: { backgroundColor: Colors.white, width: 18 },
  content: { padding: Spacing.lg },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.white,
    fontWeight: Fonts.weights.bold,
  },
  productName: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginBottom: Spacing.lg },
  price: { fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.extrabold, color: Colors.text },
  aiSection: { marginBottom: Spacing.lg },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  regionText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  detailSection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text, marginBottom: Spacing.md },
  detailGrid: { gap: Spacing.sm },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  detailLabel: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  detailValue: { fontSize: Fonts.sizes.sm, color: Colors.text, fontWeight: Fonts.weights.medium },
  descSection: { marginBottom: Spacing.lg },
  description: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, lineHeight: 24 },
  showMore: { fontSize: Fonts.sizes.sm, color: Colors.primary, marginTop: Spacing.sm, fontWeight: Fonts.weights.medium },
  reviewSection: { marginBottom: Spacing.xl },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  reviewItem: { marginBottom: Spacing.lg, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  reviewAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  reviewRating: { fontSize: Fonts.sizes.sm, color: Colors.secondary, flex: 1 },
  reviewDate: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary },
  reviewComment: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, lineHeight: 22 },
  noReview: { textAlign: 'center', color: Colors.textSecondary, paddingVertical: Spacing.xl },
  bottomAction: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  qtyButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text, minWidth: 40, textAlign: 'center' },
  actionButtons: { flexDirection: 'row', gap: Spacing.md },
  cartBtn: { flex: 1 },
  buyBtn: { flex: 2 },
});
