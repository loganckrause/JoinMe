import { useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNotificationStore } from '@/store/notifications';
import type { Notification } from '@/services/notifications';

function formatTimeAgo(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function NotificationsScreen() {
    const notifications = useNotificationStore(s => s.notifications);
    const isLoading = useNotificationStore(s => s.isLoading);
    const error = useNotificationStore(s => s.error);
    const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
    const markRead = useNotificationStore(s => s.markRead);
    const markAllRead = useNotificationStore(s => s.markAllRead);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleTap = (item: Notification) => {
        if (!item.is_read) {
            markRead(item.id);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity style={styles.notificationRow} onPress={() => handleTap(item)}>
            <View style={[styles.dot, item.is_read && styles.dotHidden]} />
            <View style={styles.notificationContent}>
                <ThemedText style={styles.notificationText}>{item.content}</ThemedText>
                <ThemedText style={styles.timeText}>
                    {formatTimeAgo(item.created_at)}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && notifications.length === 0) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.right" size={24} color="#fff" style={styles.backIcon} />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Notifications</ThemedText>
                    <View style={{ width: 80 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#59d386ff" />
                </View>
            </ThemedView>
        );
    }

    if (error && notifications.length === 0) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.right" size={24} color="#fff" style={styles.backIcon} />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Notifications</ThemedText>
                    <View style={{ width: 80 }} />
                </View>
                <View style={styles.centered}>
                    <ThemedText style={styles.errorText}>Failed to load notifications</ThemedText>
                    <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
                        <ThemedText style={styles.retryText}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.right" size={24} color="#fff" style={styles.backIcon} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Notifications</ThemedText>
                <TouchableOpacity onPress={markAllRead}>
                    <ThemedText style={styles.markAllText}>Mark all read</ThemedText>
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        tintColor="#59d386ff"
                    />
                }
                ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
                }
                contentContainerStyle={styles.list}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b0b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#0b0b0b',
    },
    backButton: {
        padding: 4,
    },
    backIcon: {
        transform: [{ scaleX: -1 }],
    },
    headerTitle: {
        fontSize: 20,
    },
    markAllText: {
        fontSize: 14,
        color: '#59d386ff',
    },
    list: {
        paddingHorizontal: 16,
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#59d386ff',
        marginTop: 5,
        marginRight: 12,
    },
    dotHidden: {
        backgroundColor: 'transparent',
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 60,
        fontSize: 16,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#59d386ff',
    },
    retryText: {
        color: '#0b0b0b',
        fontWeight: '600',
    },
});
