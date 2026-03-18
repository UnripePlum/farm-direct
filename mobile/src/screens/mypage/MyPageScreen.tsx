import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { ordersApi } from '../../api/orders';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
  color?: string;
}

const showComingSoon = () => Alert.alert('준비 중', '이 기능은 곧 제공될 예정입니다');

export const MyPageScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout } = useAuthStore();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    ordersApi.getOrders()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setOrderCount(list.length);
      })
      .catch(() => {});
  }, []);

  const handleEditProfile = () => {
    Alert.alert('프로필 수정', '프로필 수정 기능은 곧 제공될 예정입니다');
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: '쇼핑',
      items: [
        { icon: 'receipt-outline', label: '주문 내역', onPress: () => navigation.navigate('OrderHistory') },
        { icon: 'heart-outline', label: '찜한 상품', onPress: showComingSoon },
        { icon: 'bag-outline', label: '장바구니', onPress: () => navigation.navigate('Cart') },
      ],
    },
    {
      title: '서비스',
      items: [
        { icon: 'notifications-outline', label: '알림 설정', onPress: () => navigation.navigate('Settings') },
        { icon: 'star-outline', label: '내 리뷰', onPress: showComingSoon },
        { icon: 'help-circle-outline', label: '고객센터', onPress: showComingSoon },
      ],
    },
    {
      title: '계정',
      items: [
        { icon: 'settings-outline', label: '설정', onPress: () => navigation.navigate('Settings') },
        { icon: 'shield-outline', label: '개인정보 처리방침', onPress: showComingSoon },
        { icon: 'document-text-outline', label: '이용약관', onPress: showComingSoon },
        { icon: 'log-out-outline', label: '로그아웃', onPress: handleLogout, color: Colors.error },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>마이페이지</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name={user?.role === 'farmer' ? 'leaf' : 'basket'}
                size={12}
                color={Colors.primary}
              />
              <Text style={styles.roleText}>{user?.role === 'farmer' ? '농부' : '소비자'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>주문</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={showComingSoon}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>리뷰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={showComingSoon}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>찜</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group) => (
          <View key={group.title} style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            <View style={styles.menuCard}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, index < group.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color ?? Colors.textSecondary}
                    />
                    <Text style={[styles.menuLabel, item.color ? { color: item.color } : {}]}>
                      {item.label}
                    </Text>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>FarmDirect v1.0.0</Text>
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.bold, color: Colors.text },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  userEmail: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, marginVertical: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  roleText: { fontSize: Fonts.sizes.xs, color: Colors.primary, fontWeight: Fonts.weights.semibold },
  editProfileBtn: { padding: Spacing.xs },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  statValue: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.extrabold, color: Colors.text },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, marginTop: 4 },
  menuGroup: { marginBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  menuGroupTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, paddingLeft: Spacing.xs },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuLabel: { fontSize: Fonts.sizes.md, color: Colors.text },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: { fontSize: Fonts.sizes.xs, color: Colors.white, fontWeight: Fonts.weights.bold },
  version: { textAlign: 'center', fontSize: Fonts.sizes.xs, color: Colors.textLight, marginVertical: Spacing.lg },
});
