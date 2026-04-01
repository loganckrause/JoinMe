import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface MockNotification {
    id: string;
    content: string;
    time: string;
    isRead: boolean;
    type: string;
}

const MOCK_NOTIFICATIONS: MockNotification[] = [
    { id: '1', content: 'Alex is interested in Rock Climbing', time: '2h ago', isRead: false, type: 'swipe' },
    { id: '2', content: 'Hiking event details updated — new meetup location', time: '5h ago', isRead: false, type: 'event_update' },
    { id: '3', content: 'Jordan joined your Pickup Basketball event', time: '1d ago', isRead: false, type: 'swipe' },
    { id: '4', content: "Don't forget to rate last week's Book Club!", time: '2d ago', isRead: true, type: 'rate_reminder' },
    { id: '5', content: 'Sam is interested in Skiing', time: '3d ago', isRead: true, type: 'swipe' },
];

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const toggleRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const renderItem = ({ item }: { item: MockNotification }) => (
        <TouchableOpacity style={styles.notificationRow} onPress={() => toggleRead(item.id)}>
            <View style={[styles.dot, item.isRead && styles.dotHidden]} />
            <View style={styles.notificationContent}>
                <ThemedText style={styles.notificationText}>{item.content}</ThemedText>
                <ThemedText style={styles.timeText}>{item.time}</ThemedText>
            </View>
        </TouchableOpacity>
    );

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
                keyExtractor={item => item.id}
                renderItem={renderItem}
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
});
