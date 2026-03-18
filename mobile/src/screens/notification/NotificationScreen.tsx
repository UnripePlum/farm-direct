import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../theme';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotificationStore } from '../../store/notificationStore';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  order_status: { icon: 'bag-outline', color: Colors.primary, bg: '#DCFCE7' },
  price_alert: { icon: 'trending-up-outline', color: Colors.secondary, bg: '#FEF3C7' },
  promotion: { icon: 'megaphone-outline', color: '#3B82F6', bg: '#DBEAFE' },
};

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, []);

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = NOTIFICATION_ICONS[item.type] ?? NOTIFICATION_ICONS.promotion;
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.is_read && styles.notifUnread]}
        onPress={() => { if (!item.is_read) markAsRead(item.id); }}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>알림</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="알림을 불러오는 중..." />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>알림이 없습니다</Text>
              <Text style={styles.emptySubtitle}>새로운 알림이 오면 여기에 표시됩니다</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} tintColor={Colors.primary} />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.text },
  listContent: { paddingVertical: Spacing.sm },
  notifItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  notifUnread: { backgroundColor: '#F0FDF4' },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.text },
  notifTitleUnread: { fontWeight: Fonts.weights.semibold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMessage: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  notifTime: { fontSize: Fonts.sizes.xs, color: Colors.textLight, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: Spacing.md },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.textSecondary },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textLight, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
