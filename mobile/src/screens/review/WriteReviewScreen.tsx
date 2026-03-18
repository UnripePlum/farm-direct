import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { Button } from '../../components/common/Button';
import { StarRating } from '../../components/common/StarRating';
import { reviewsApi } from '../../api/reviews';

export const WriteReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, productId, productName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('알림', '별점을 선택해주세요');
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert('알림', '리뷰 내용을 10자 이상 입력해주세요');
      return;
    }
    setIsLoading(true);
    try {
      await reviewsApi.createReview({ product_id: productId, order_id: orderId, rating, text: comment });
      Alert.alert('완료', '리뷰가 등록되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('오류', '리뷰 등록에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const RATING_LABELS = ['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요!'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>리뷰 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.productInfo}>
            <View style={styles.productIcon}>
              <Ionicons name="leaf" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.productName}>{productName}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>이 상품은 어떠셨나요?</Text>
            <StarRating rating={rating} size={44} editable onRatingChange={setRating} />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>상세 리뷰</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="상품에 대한 솔직한 리뷰를 남겨주세요 (10자 이상)"
              placeholderTextColor={Colors.textLight}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>리뷰 작성 가이드</Text>
            {[
              '상품의 신선도나 품질에 대해 알려주세요',
              '포장 상태나 배송에 대한 의견도 환영해요',
              '다른 구매자에게 도움이 되는 정보를 공유해주세요',
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="리뷰 등록하기" onPress={handleSubmit} loading={isLoading} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: { padding: Spacing.lg, gap: Spacing.xl },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { flex: 1, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold, color: Colors.text },
  ratingSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.text },
  ratingLabel: { fontSize: Fonts.sizes.lg, color: Colors.secondary, fontWeight: Fonts.weights.semibold },
  commentSection: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  commentInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: { alignSelf: 'flex-end', fontSize: Fonts.sizes.xs, color: Colors.textSecondary },
  tips: { backgroundColor: '#F0FDF4', borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm },
  tipsTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.primary, marginBottom: 4 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  tipText: { flex: 1, fontSize: Fonts.sizes.xs, color: Colors.textSecondary, lineHeight: 18 },
  footer: { padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
