import { useCallback, useState } from "react";
import { TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import Sidebar from "@/components/ui/sidebar";
import EventList from "@/components/ui/event-list";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { fetchEventsHosted, EventCard } from "@/services/events";
import { useAuthStore } from "@/store/auth";
import { useLocalSearchParams } from "expo-router";

export default function CreatedEventsScreen() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [events, setEvents] = useState<EventCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();

    useFocusEffect(
        useCallback(() => {
            const loadEvents = async () => {
                try {
                    setLoading(true);
                    const data = await fetchEventsHosted(token ?? undefined, userId ? Number(userId) : undefined);
                    setEvents(data);
                    setError(null);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to load events");
                    setEvents([]);
                } finally {
                    setLoading(false);
                }
            };

            loadEvents();
        }, [token])
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000000ff' }}>
            <ThemedView style={styles.topBar}>
                <ThemedView style={styles.side}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                        <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                    </TouchableOpacity>
                </ThemedView>
                <ThemedView style={styles.center}>
                    <ThemedText style={styles.title}>Created Events</ThemedText>
                </ThemedView>
                <ThemedView style={styles.side} />
            </ThemedView>
            <ThemedView style={styles.container}>
                {loading && <ThemedText style={{ color: '#fff' }}>Loading events...</ThemedText>}
                {error && <ThemedText style={{ color: 'red' }}>{error}</ThemedText>}
                {!loading && events.length === 0 && !error && (
                    <ThemedText style={{ color: '#fff' }}>Looks like you haven't created any events yet.</ThemedText>
                )}
                {!loading && events.length > 0 && <EventList events={events} />}
                <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={user ? { name: user.name, photoUri: user.user_picture } : { name: "User", photoUri: null }}
                />
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        height: 150,
        backgroundColor: '#000000ff',
    },
    side: {
        width: 40,
        justifyContent: "center",
        backgroundColor: '#000000ff',
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#000000ff',
    },
    title: {
        fontSize: 20,
        color: "#fff",
    },
    container: {
        flex: 1,
        width: "100%",
        paddingHorizontal: 20,
        backgroundColor: '#000000ff',
    },
});
