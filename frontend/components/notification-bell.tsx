import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';

export function NotificationBell() {
    const unreadCount = 3;

    return (
        <TouchableOpacity onPress={() => router.push('/notifications')} >
            <IconSymbol name="bell.fill" size={28} color="#fff" />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
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
