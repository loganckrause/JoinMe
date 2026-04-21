import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";

import Sidebar from "@/components/ui/sidebar";
import EventList from "@/components/ui/event-list";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { fetchEvents, EventCard } from "@/services/events";
import { useAuthStore } from "@/store/auth";
import { toSidebarUser } from "@/services/user";

export default function AllEventsScreen() {
        const [sidebarOpen, setSidebarOpen] = useState(false);
        const [events, setEvents] = useState<EventCard[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const user = useAuthStore((state) => state.user);
        const token = useAuthStore((state) => state.token);
        const [showFilters, setShowFilters] = useState(false);
        const [radius, setRadius] = useState<number>(50);

        const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

        useEffect(() => {
            let mounted = true;

            const loadEvents = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const fetchedEvents = await fetchEvents(radius, token);
                    if (mounted) {
                        setEvents(fetchedEvents);
                    }
                } catch (loadError) {
                    if (mounted) {
                        setError(loadError instanceof Error ? loadError.message : 'Failed to load events');
                    }
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            loadEvents();

            return () => {
                mounted = false;
            };
        }, [radius, token]);

  return(
    <ScrollView style={{ flex: 1 }}>
    
        <ThemedView style={styles.topBar}>
    
            <View style={styles.side}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                    <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                </TouchableOpacity>
            </View>

            <ThemedText style={styles.title}>
                All Events
            </ThemedText>

            <View style={styles.side}>
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                    <IconSymbol name="line.3.horizontal.decrease.circle" color="#fff" size={30} />
                  
                </TouchableOpacity>
            </View>

        </ThemedView>

    {showFilters && (
        <View style={styles.filterContainer}>
            <ThemedText style={styles.filterTitle}>Search Radius (miles):</ThemedText>
            <View style={styles.radiusOptions}>
                {RADIUS_OPTIONS.map(r => (
                    <TouchableOpacity key={r} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]} onPress={() => setRadius(r)}>
                        <ThemedText style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )}

        <View style={styles.container}>
        {loading ? <ThemedText>Loading events...</ThemedText> : null}
        {!loading && error ? <ThemedText>{error}</ThemedText> : null}
        {!loading && !error && events.length === 0 ? <ThemedText>No events found.</ThemedText> : null}
            <EventList events={events} />
            <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
            user={toSidebarUser(user)}
            />
         </View>
        </ScrollView> 
        );
}   

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#transparent",
    paddingHorizontal: 20,
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
    title: {
        textAlign: 'center',
        fontSize: 20,
    },
    side: {
        width: 40, 
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    toggle: {
        opacity: 0.7,
},
filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
},
filterTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff',
},
radiusOptions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
},
radiusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#222',
},
radiusBtnActive: {
    borderColor: '#59d386ff',
    backgroundColor: '#59d386ff',
},
radiusBtnText: {
    color: '#aaa',
},
radiusBtnTextActive: {
    color: '#000',
    fontWeight: 'bold',
    },


});