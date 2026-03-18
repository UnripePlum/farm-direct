import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';

export const RoleSelectScreen: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'consumer' | null>(null);
  const { isLoading, user } = useAuthStore();

  const handleConfirm = async () => {
    if (!selectedRole) {
      Alert.alert('역할 선택', '역할을 선택해주세요');
      return;
    }
    // Role is set at registration time in the new backend.
    // This screen is informational only after signup.
    Alert.alert('안내', '역할은 회원가입 시 설정됩니다.');
  };

  return (
    <View testID="screen-role-select" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Ionicons name="person" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.greeting}>안녕하세요, {user?.name ?? '회원'}님!</Text>
        <Text style={styles.title}>어떤 역할로 시작하실건가요?</Text>
        <Text style={styles.subtitle}>역할에 맞는 맞춤 경험을 제공해드립니다</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          testID="role-farmer-button"
          style={[styles.roleCard, selectedRole === 'farmer' && styles.roleCardSelected]}
          onPress={() => setSelectedRole('farmer')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrapper, { backgroundColor: selectedRole === 'farmer' ? Colors.primary : '#DCFCE7' }]}>
            <Ionicons name="leaf" size={44} color={selectedRole === 'farmer' ? Colors.white : Colors.primary} />
          </View>
          <Text style={[styles.roleTitle, selectedRole === 'farmer' && styles.roleTitleSelected]}>농부</Text>
          <Text style={styles.roleDesc}>신선한 농산물을 직접 판매하고{'\n'}AI 가격 분석으로 최대 수익을 올리세요</Text>
          <View style={styles.features}>
            {['상품 등록 및 관리', 'AI 가격 추천', '수요 예측 분석', '판매 통계'].map((f) => (
              <View key={f} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          {selectedRole === 'farmer' && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID="role-consumer-button"
          style={[styles.roleCard, selectedRole === 'consumer' && styles.roleCardSelected]}
          onPress={() => setSelectedRole('consumer')}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrapper, { backgroundColor: selectedRole === 'consumer' ? Colors.secondary : '#FEF3C7' }]}>
            <Ionicons name="basket" size={44} color={selectedRole === 'consumer' ? Colors.white : Colors.secondary} />
          </View>
          <Text style={[styles.roleTitle, selectedRole === 'consumer' && styles.roleTitleSelected]}>소비자</Text>
          <Text style={styles.roleDesc}>농부에게 직접 구매하는{'\n'}신선하고 합리적인 장보기</Text>
          <View style={styles.features}>
            {['신선한 직거래 농산물', '개인화 추천', '주문 실시간 추적', '리뷰 작성'].map((f) => (
              <View key={f} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          {selectedRole === 'consumer' && (
            <View style={[styles.selectedBadge, { backgroundColor: Colors.secondary }]}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title="시작하기"
          onPress={handleConfirm}
          loading={isLoading}
          disabled={!selectedRole}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Fonts.sizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  cards: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  roleIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  roleTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  roleTitleSelected: { color: Colors.primary },
  roleDesc: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  features: { gap: Spacing.xs },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.text,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: 40,
    marginTop: 'auto',
  },
});
