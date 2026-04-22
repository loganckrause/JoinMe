import { create } from 'zustand';

import {
    Notification,
    fetchNotifications as apiFetchNotifications,
    fetchUnreadCount as apiFetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    respondToAttendancePoll,
} from '@/services/notifications';
import { useAuthStore } from './auth';

type NotificationStore = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
    respondToPoll: (id: number, attended: boolean) => Promise<void>;
    reset: () => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
            const notifications = await apiFetchNotifications(token);
            const unreadCount = notifications.filter(n => !n.is_read).length;
            set({ notifications, unreadCount, isLoading: false });
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
            const unreadCount = await apiFetchUnreadCount(token);
            set({ unreadCount });
        } catch {
            // silent — badge is non-critical
        }
    },

    markRead: async (id: number) => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        // Optimistic update
        const prev = get().notifications;
        set({
            notifications: prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n,
            ),
            unreadCount: Math.max(0, get().unreadCount - 1),
        });

        try {
            await markNotificationRead(token, id);
        } catch {
            // Revert on failure
            set({ notifications: prev, unreadCount: get().unreadCount + 1 });
        }
    },

    markAllRead: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        // Optimistic update
        const prev = get().notifications;
        set({
            notifications: prev.map(n => ({ ...n, is_read: true })),
            unreadCount: 0,
        });

        try {
            await markAllNotificationsRead(token);
        } catch {
            // Revert on failure
            set({ notifications: prev, unreadCount: prev.filter(n => !n.is_read).length });
        }
    },

    respondToPoll: async (id: number, attended: boolean) => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        // Optimistic update
        const prev = get().notifications;
        set({
            notifications: prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n,
            ),
            unreadCount: Math.max(0, get().unreadCount - 1),
        });

        try {
            await respondToAttendancePoll(token, id, attended);
        } catch {
            // Revert on failure
            set({ notifications: prev, unreadCount: get().unreadCount + 1 });
        }
    },

    reset: () => {
        set({ notifications: [], unreadCount: 0, isLoading: false, error: null });
    },
}));
