import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";

import Sidebar from "@/components/ui/sidebar";
import EventList from "@/components/ui/event-list";
import FilterModal from "@/components/ui/filter-modal";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { fetchEvents, EventCard, EventFilters } from "@/services/events";
import { useAuthStore } from "@/store/auth";
import { toSidebarUser } from "@/services/user";

export default function AllEventsScreen() {
        const [sidebarOpen, setSidebarOpen] = useState(false);
        const [filterModalOpen, setFilterModalOpen] = useState(false);
        const [filters, setFilters] = useState<EventFilters>({});
        const [events, setEvents] = useState<EventCard[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const user = useAuthStore((state) => state.user);

        const hasActiveFilters =
            filters.categoryId != null ||
            !!filters.dateFrom ||
            !!filters.dateTo ||
            !!filters.location;

        useEffect(() => {
            let mounted = true;

            const loadEvents = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const fetchedEvents = await fetchEvents(filters);
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
        }, [filters]);

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
                <TouchableOpacity onPress={() => setFilterModalOpen(true)}>
                    <IconSymbol name="line.3.horizontal.decrease.circle" color="#fff" size={30} />
                    {hasActiveFilters && <View style={styles.filterDot} />}
                </TouchableOpacity>
            </View>

        </ThemedView>

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
            <FilterModal
                visible={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                initial={filters}
                onApply={setFilters}
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
    filterDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#59d386ff',
    },


});