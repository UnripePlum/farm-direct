import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [orderNotif, setOrderNotif] = useState(true);
  const [priceNotif, setPriceNotif] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);

  const renderToggle = (label: string, value: boolean, onToggle: (v: boolean) => void, desc?: string) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc && <Text style={styles.toggleDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <View style={styles.card}>
            {renderToggle('푸시 알림', pushEnabled, setPushEnabled, '모든 알림을 켜거나 끕니다')}
            <View style={styles.divider} />
            {renderToggle('주문 알림', orderNotif, setOrderNotif, '주문 상태 변경 알림')}
            <View style={styles.divider} />
            {renderToggle('가격 알림', priceNotif, setPriceNotif, '관심 상품 가격 변동 알림')}
            <View style={styles.divider} />
            {renderToggle('AI 인사이트', aiInsights, setAiInsights, 'AI 분석 및 추천 알림')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.card}>
            {[
              { label: '버전', value: '1.0.0' },
              { label: '오픈소스 라이선스', value: '' },
            ].map(({ label, value }, i) => (
              <View key={label}>
                <TouchableOpacity style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </TouchableOpacity>
                {i === 0 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, paddingLeft: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.small },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  toggleLeft: { flex: 1, marginRight: Spacing.md },
  toggleLabel: { fontSize: Fonts.sizes.md, color: Colors.text, fontWeight: Fonts.weights.medium },
  toggleDesc: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.lg },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  infoLabel: { fontSize: Fonts.sizes.md, color: Colors.text },
  infoValue: { fontSize: Fonts.sizes.md, color: Colors.textSecondary },
});
