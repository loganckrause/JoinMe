import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationBell } from '@/components/notification-bell';
import Sidebar from '@/components/ui/sidebar';
import FilterModal from '@/components/ui/filter-modal';
import { fetchEvents, EventCard, EventFilters, recordSwipe } from '@/services/events';
import { useAuthStore } from '@/store/auth';
import { toSidebarUser } from '@/services/user';


export default function FeedScreen() {
    const [queue, setQueue] = useState<EventCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<EventFilters>({});
    const token = useAuthStore((state) => state.token);

    const hasActiveFilters =
        filters.categoryId != null ||
        !!filters.dateFrom ||
        !!filters.dateTo ||
        (filters.radius != null && filters.radius !== 50);

    useEffect(() => {
        let mounted = true;

        const loadEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                const events = await fetchEvents(filters.radius || 50, token, filters);
                if (mounted) setQueue(events);
            } catch (loadError) {
                if (mounted) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load events');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadEvents();
        return () => { mounted = false; };
    }, [filters, token]);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = useAuthStore((state) => state.user);

    const currentEvent = queue[0] ?? null;
    const nextEvent = queue[1] ?? null;
    const isEmpty = !loading && queue.length === 0;

    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
    }, [currentEvent?.id]);

    const dismissTop = () => {
        setQueue(prev => prev.slice(1));
    };

    const handleSwipeDecision = async (status: boolean) => {
        if (!currentEvent) return;
        try {
            await recordSwipe(currentEvent.id, status, token ?? undefined);
        } catch (swipeError) {
            setError(swipeError instanceof Error ? swipeError.message : 'Failed to record swipe');
            return;
        }
        dismissTop();
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
        })
        .onEnd(() => {
            if (translateX.value > 150 || translateX.value < -150) {
                const shouldAccept = translateX.value > 0;
                translateX.value = withSpring(
                    translateX.value > 0 ? 500 : -500,
                    {},
                    () => runOnJS(handleSwipeDecision)(shouldAccept)
                );
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15]);
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>

            <ThemedView style={styles.topBar}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.title} pointerEvents="none">JoinMe</ThemedText>
                <ThemedView style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setFilterModalOpen(true)}>
                        <IconSymbol name="line.3.horizontal.decrease.circle" color="#fff" size={30} />
                        {hasActiveFilters && <ThemedView style={styles.filterDot} />}
                    </TouchableOpacity>
                    <NotificationBell />
                </ThemedView>
            </ThemedView>

            <ThemedView style={styles.container}>

                {loading ? (
                    <ThemedView style={styles.emptyState}>
                        <ThemedText style={styles.emptyTitle}>Loading events...</ThemedText>
                    </ThemedView>
                ) : error ? (
                    <ThemedView style={styles.emptyState}>
                        <ThemedText style={styles.emptyTitle}>{error}</ThemedText>
                    </ThemedView>
                ) : isEmpty ? (
                    <ThemedView style={styles.emptyState}>
                        <ThemedText style={styles.emptyTitle}>No new events</ThemedText>
                        <ThemedText style={styles.emptyTitle}>Come back later</ThemedText>
                    </ThemedView>
                ) : (
                    <>
                        {nextEvent && (
                            <ThemedView style={styles.eventCard}>
                                <Image source={{ uri: nextEvent.image }} style={styles.eventImage} />
                                <ThemedView style={styles.row}>
                                    <ThemedText numberOfLines={2} style={styles.eventTitleText}>{nextEvent.title}</ThemedText>
                                    <ThemedView style={styles.peopleWrap}>
                                        <ThemedText style={styles.peopleText}>{nextEvent.number}</ThemedText>
                                        <IconSymbol size={30} name="person.3" color="#fff" />
                                    </ThemedView>
                                </ThemedView>
                                <ThemedText style={styles.text2}>{nextEvent.location}</ThemedText>
                            </ThemedView>
                        )}

                        <GestureDetector gesture={panGesture}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push({ pathname: '/event', params: { event: JSON.stringify(currentEvent) } })}
                            >
                                <Animated.View key={currentEvent!.id} style={[styles.eventCard, animatedStyle]}>
                                    <Image source={{ uri: currentEvent!.image }} style={styles.eventImage} />
                                    <ThemedView style={styles.row}>
                                        <ThemedText numberOfLines={2} style={styles.eventTitleText}>{currentEvent!.title}</ThemedText>
                                        <ThemedView style={styles.peopleWrap}>
                                            <ThemedText style={styles.peopleText}>{currentEvent!.number}</ThemedText>
                                            <IconSymbol size={30} name="person.3" color="#fff" />
                                        </ThemedView>
                                    </ThemedView>
                                    <ThemedText style={styles.text2}>{currentEvent!.location}</ThemedText>
                                </Animated.View>
                            </TouchableOpacity>
                        </GestureDetector>

                        <ThemedView style={styles.buttrow}>
                            <TouchableOpacity style={styles.nobutt} onPress={() => handleSwipeDecision(false)}>
                                <ThemedText style={styles.nobuttText}>✕</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.yesbutt} onPress={() => handleSwipeDecision(true)}>
                                <ThemedText style={styles.yesbuttText}>✓</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </>
                )}

                <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={toSidebarUser(user)}
                />
                <FilterModal
                    visible={filterModalOpen}
                    onClose={() => setFilterModalOpen(false)}
                    initial={filters}
                    onApply={setFilters}
                />
            </ThemedView>

        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    title: {
        textAlign: 'center',
        fontSize: 40,
        backgroundColor: 'transparent',
        paddingTop: 40,
        position: 'absolute',
        left: 0,
        right: 0,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: 'transparent',
        height: 150,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: 'transparent',
    },
    filterDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#59d386ff',
    },
    eventCard: {
        position: 'absolute',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        width: 375,
        padding: 13,
        height: 500,
        backgroundColor: '#0f0f0f',
        alignSelf: 'center',
    },
    emptyState: {
        justifyContent: 'center',
        gap: 16,
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        width: 375,
        height: 500,
        padding: 13,
        backgroundColor: 'transparent',
    },
    eventImage: {
        width: 350,
        height: 350,
        borderRadius: 20,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
    },
    eventTitleText: {
        paddingTop: 20,
        fontSize: 30,
        lineHeight: 34,
        flex: 1,
        flexShrink: 1,
        paddingRight: 12,
        backgroundColor: 'transparent',
    },
    peopleWrap: {
        paddingTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        backgroundColor: 'transparent',
    },
    peopleText: {
        fontSize: 24,
        backgroundColor: 'transparent',
    },
    text2: {
        fontSize: 20,
        backgroundColor: 'transparent',
    },
    buttrow: {
        flexDirection: 'row',
        gap: 140,
        backgroundColor: 'transparent',
        paddingBottom: 60,
    },
    nobutt: {
        borderColor: '#dd3939ff',
        borderWidth: 1,
        borderRadius: 100,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    yesbutt: {
        borderColor: '#59d386ff',
        borderWidth: 1,
        borderRadius: 100,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nobuttText: {
        fontSize: 30,
        color: '#dd3939ff',
        padding: 10,
        bottom: -3,
    },
    yesbuttText: {
        fontSize: 30,
        color: '#59d386ff',
        padding: 10,
        bottom: -3,
    },
    emptyTitle: {
        justifyContent: 'center',
        fontSize: 24,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Inter-Light',
    },
});