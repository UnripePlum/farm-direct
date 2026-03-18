import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { RecommendedProducts } from '../../components/home/RecommendedProducts';
import { CategoryGrid } from '../../components/home/CategoryGrid';
import { PriceTrendWidget } from '../../components/home/PriceTrendWidget';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      fetchUnreadCount(),
    ]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '안녕하세요';
    return '안녕하세요';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name ?? '회원'}님</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Ionicons name="search-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTag}>AI 추천</Text>
            <Text style={styles.bannerTitle}>오늘의 제철 농산물{'\n'}최대 30% 할인</Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.bannerButtonText}>지금 확인하기</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.bannerIllustration}>
            <Ionicons name="leaf" size={70} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        <CategoryGrid />
        <RecommendedProducts />
        <PriceTrendWidget />

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  greeting: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  userName: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  topActions: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: { position: 'relative', padding: Spacing.xs },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: Fonts.weights.bold },
  scroll: { flex: 1 },
  banner: {
    margin: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 140,
  },
  bannerContent: { flex: 1, justifyContent: 'space-between' },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    fontSize: Fonts.sizes.xs,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  bannerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  bannerButtonText: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: Fonts.weights.semibold },
  bannerIllustration: { alignItems: 'center', justifyContent: 'center', paddingLeft: Spacing.md },
});
