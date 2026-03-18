import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { productsApi } from '../../api/products';
import { useCategories } from '../../hooks/useProducts';
import { useQueryClient } from '@tanstack/react-query';

export const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    region: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.name.trim()) newErrors.name = '상품명을 입력해주세요';
    if (!form.price.trim()) newErrors.price = '가격을 입력해주세요';
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) newErrors.price = '올바른 가격을 입력해주세요';
    if (!form.stock.trim()) newErrors.stock = '재고를 입력해주세요';
    else if (isNaN(Number(form.stock)) || Number(form.stock) < 0) newErrors.stock = '올바른 재고를 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await productsApi.createProduct({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: selectedCategoryId,
        region: form.region.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('완료', '상품이 등록되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('오류', err?.response?.data?.detail ?? '상품 등록에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView testID="screen-add-product" style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>상품 등록</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="상품명"
            placeholder="상품명을 입력하세요"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            leftIcon="cube-outline"
            testID="add-product-name-input"
          />
          <Input
            label="설명"
            placeholder="상품 설명을 입력하세요"
            value={form.description}
            onChangeText={(v) => updateField('description', v)}
            leftIcon="document-text-outline"
            testID="add-product-description-input"
          />
          <Input
            label="가격 (원)"
            placeholder="가격을 입력하세요"
            value={form.price}
            onChangeText={(v) => updateField('price', v)}
            keyboardType="numeric"
            error={errors.price}
            leftIcon="pricetag-outline"
            testID="add-product-price-input"
          />
          <Input
            label="재고"
            placeholder="재고 수량을 입력하세요"
            value={form.stock}
            onChangeText={(v) => updateField('stock', v)}
            keyboardType="numeric"
            error={errors.stock}
            leftIcon="layers-outline"
            testID="add-product-stock-input"
          />
          <Input
            label="지역"
            placeholder="생산 지역을 입력하세요"
            value={form.region}
            onChangeText={(v) => updateField('region', v)}
            leftIcon="location-outline"
            testID="add-product-region-input"
          />

          {/* Category Selection */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>카테고리</Text>
            <View style={styles.categoryGrid}>
              {(categories ?? []).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategoryId === cat.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategoryId === cat.id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos placeholder */}
          <View style={styles.photoSection}>
            <Text style={styles.categoryLabel}>사진</Text>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => Alert.alert('준비 중', '사진 업로드 기능은 곧 제공될 예정입니다')}
            >
              <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>사진 추가</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="상품 등록"
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="lg"
            testID="add-product-submit-button"
          />
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
  scrollContent: { padding: Spacing.lg, gap: Spacing.sm },
  categorySection: { marginTop: Spacing.sm },
  categoryLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  categoryChipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontWeight: Fonts.weights.semibold,
  },
  photoSection: { marginTop: Spacing.md },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  photoPlaceholderText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
