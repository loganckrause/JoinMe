import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useNotificationStore } from '@/store/notifications';

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
    const unreadCount = useNotificationStore(s => s.unreadCount);
    const fetchUnreadCount = useNotificationStore(s => s.fetchUnreadCount);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetchUnreadCount();

        intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                fetchUnreadCount();
            }
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            subscription.remove();
        };
    }, [fetchUnreadCount]);

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <TouchableOpacity onPress={() => router.push('/notifications')} >
            <IconSymbol name="bell.fill" size={28} color="#fff" />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{displayCount}</ThemedText>
                </View>
            )}
        </TouchableOpacity>
    );
}
const styles = StyleSheet.create({
    container: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: 2,
        backgroundColor: '#dd3939ff',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 18,
    },
});
