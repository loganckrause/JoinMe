import { useState } from "react";
import { TouchableOpacity, StyleSheet, ScrollView } from "react-native";

import Sidebar from "@/components/ui/sidebar";
import EventList from "@/components/ui/event-list";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol.ios";

export default function AcceptedEventsScreen() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = {
        name: "John Doe",
        photoUri: null,
    };
    const events = [                 //Placeholder event data
        {
            title: "Rock Climbing",
            number: "2",
            location: "Philadelphia",
            image: "https://plus.unsplash.com/premium_photo-1672280940819-7ddad7c44fe1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGluZG9vciUyMHJvY2slMjBjbGltYmluZ3xlbnwwfHwwfHx8MA%3D%3D",
            description: "Looking for a partner to go rock climbing with this Monday!"
        },
        {
            title: "Hiking",
            number: "6",
            location: "Hamburg",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGlraW5nfGVufDB8fDB8fHww",
            description: "With the warmer weather it's a perfect time to go hiking and meet some new people!  Open to all experience levels!"
        },
        {
            title: "Pickup-Basketball",
            number: "8",
            location: "YMCA",
            image: "https://plus.unsplash.com/premium_photo-1722686462153-428054d35549?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aW5kb29yJTIwcGlja3VwJTIwYmFza2V0YmFsbHxlbnwwfHwwfHx8MA%3D%3D",
            description: "Looking for some people to play basketball this Friday!"
        },
    ]

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000000ff' }}>
            <ThemedView style={styles.topBar}>
                <ThemedView style={styles.side}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                        <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                    </TouchableOpacity>
                </ThemedView>
                <ThemedView style={styles.center}>
                    <ThemedText style={styles.title}>Accepted Events</ThemedText>
                </ThemedView>
                <ThemedView style={styles.side} />
            </ThemedView>
            <ThemedView style={styles.container}>
                <EventList events={events} />
                <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={user}
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
