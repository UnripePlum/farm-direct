import { create } from 'zustand';
import { notificationsApi } from '../api/notifications';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await notificationsApi.getNotifications();
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    await notificationsApi.markAsRead(id);
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    set({ notifications, unreadCount: Math.max(0, get().unreadCount - 1) });
  },

  fetchUnreadCount: async () => {
    try {
      const notifications = await notificationsApi.getNotifications();
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ unreadCount });
    } catch {
      // silent fail
    }
  },
}));
