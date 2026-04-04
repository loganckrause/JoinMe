import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";

import Sidebar from "@/components/ui/sidebar";
import EventList from "@/components/ui/event-list";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";

export default function AllEventsScreen() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = {
        name: "John Doe",
        age: 26,
        city: "Philadelphia",
        interests: ["Exercise", "Sport", "Indoor"],
        about:
        "Hey, I'm John! I’m looking for a partner (or a small group) to go climbing with this Saturday. Whether you're a pro or just getting started, come hang out!",
        avatar: "https://randomuser.me/api/portraits/lego/1.jpg", 
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
        {
            title: "Skiing",
            number: "8-10",
            location: "Liberty Mountain",
            image: "https://images.unsplash.com/photo-1582048551464-8b1d42010271?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2tpaW5nfGVufDB8fDB8fHww",
            description: "Looking for some people who would like to go on a ski trip to Liberty Mountain this weekend.  I am a proficient skier and am fine with going down Black Diamond courses, though am also happy with beginner to intermediate slopes."
        },
        {
            title: "Book Club",
            number: "6-7",
            location: "Charles Library",
            image: "https://plus.unsplash.com/premium_photo-1706061121923-e2aef3d28939?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJvb2slMjBjbHVifGVufDB8fDB8fHww",
            description: "Looking for more members to join our weekly book club!  We meet every Tuesday at 6:30pm.  Snacks and refreshments will be provided."
        },
        {
            title: "Book Club",
            number: "1-7",
            location: "Charles Library",
            image: "https://plus.unsplash.com/premium_photo-1706061121923-e2aef3d28939?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJvb2slMjBjbHVifGVufDB8fDB8fHww",
            description: "Looking for more members to join our weekly book club!  We meet every Tuesday at 6:30pm.  Snacks and refreshments will be provided."
        },
        {
            title: "Skiing",
            number: "2-10",
            location: "Liberty Mountain",
            image: "https://images.unsplash.com/photo-1582048551464-8b1d42010271?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2tpaW5nfGVufDB8fDB8fHww",
            description: "Looking for some people who would like to go on a ski trip to Liberty Mountain this weekend.  I am a proficient skier and am fine with going down Black Diamond courses, though am also happy with beginner to intermediate slopes."
        },
        {
            title: "Book Club",
            number: "3-7",
            location: "Charles Library",
            image: "https://plus.unsplash.com/premium_photo-1706061121923-e2aef3d28939?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJvb2slMjBjbHVifGVufDB8fDB8fHww",
            description: "Looking for more members to join our weekly book club!  We meet every Tuesday at 6:30pm.  Snacks and refreshments will be provided."
        },
        {
            title: "Book Club",
            number: "8-7",
            location: "Charles Library",
            image: "https://plus.unsplash.com/premium_photo-1706061121923-e2aef3d28939?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJvb2slMjBjbHVifGVufDB8fDB8fHww",
            description: "Looking for more members to join our weekly book club!  We meet every Tuesday at 6:30pm.  Snacks and refreshments will be provided."
        }
    ]

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
                <TouchableOpacity>
                    <IconSymbol name="line.3.horizontal.decrease.circle" color="#fff" size={30} />
                  
                </TouchableOpacity>
            </View>

        </ThemedView>

        <View style={styles.container}>
            <EventList events={events} />
            <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={user}
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


});