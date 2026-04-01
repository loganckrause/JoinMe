import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationBell } from '@/components/notification-bell';


export default function FeedScreen() {

    const events = [                 //Placeholder event data
        {
            title: "Rock Climbing",
            number: "2",
            location: "Philadelphia",
            image: "https://plus.unsplash.com/premium_photo-1672280940819-7ddad7c44fe1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGluZG9vciUyMHJvY2slMjBjbGltYmluZ3xlbnwwfHwwfHx8MA%3D%3D",
        },
        {
            title: "Hiking",
            number: "6",
            location: "Hamburg",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGlraW5nfGVufDB8fDB8fHww"
        },
        {
            title: "Pickup-Basketball",
            number: "8",
            location: "YMCA",
            image: "https://plus.unsplash.com/premium_photo-1722686462153-428054d35549?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aW5kb29yJTIwcGlja3VwJTIwYmFza2V0YmFsbHxlbnwwfHwwfHx8MA%3D%3D"
        },
        {
            title: "Skiing",
            number: "8-10",
            location: "Liberty Mountain",
            image: "https://images.unsplash.com/photo-1582048551464-8b1d42010271?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2tpaW5nfGVufDB8fDB8fHww"
        },
        {
            title: "Book Club",
            number: "6-7",
            location: "Charles Library",
            image: "https://plus.unsplash.com/premium_photo-1706061121923-e2aef3d28939?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJvb2slMjBjbHVifGVufDB8fDB8fHww"
        }
    ]

    const [event, setEvent] = useState(events[0])

    const handleSwipeResult = () => {
        setEvent(events[Math.floor(Math.random() * events.length)]);
    }

    const panGesture = Gesture.Pan().onEnd((event) => {
            if(event.translationX < -80 || event.translationX > 80) {
                runOnJS(handleSwipeResult)();
            }
        }
    )

    const ick = () => {
        if (event.number == "2") {
            return "person.2"
        } else {
            return "person.3"
        }
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemedView style={styles.header}>
                <ThemedView style={styles.headerSpacer} />
                <ThemedText type="defaultSemiBold" style={styles.title}>JoinMe</ThemedText>
                <NotificationBell />
            </ThemedView>
            <ThemedView style={styles.container}>
                <GestureDetector gesture={panGesture}>
                    <ThemedView style={styles.eventCard}>
                        <Image source={{ uri: event.image }} style={styles.eventImage} />
                        <ThemedView style={styles.row}>
                            <ThemedText style={styles.text}>{event.title}</ThemedText>
                            <ThemedText style={styles.text}>{event.number}{' '}<IconSymbol size={35} name={ick()} color="#fff" /></ThemedText>
                        </ThemedView>
                        <ThemedText style={styles.text2}>{event.location}</ThemedText>
                    </ThemedView>
                </GestureDetector>
                <ThemedView style={styles.buttrow}>
                    <TouchableOpacity style={styles.nobutt} onPress={handleSwipeResult}>
                        <ThemedText style={styles.nobuttText}>X</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.yesbutt} onPress={handleSwipeResult}>
                        <ThemedText style={styles.yesbuttText}>✓</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 100,
        height: '100%',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0a0a0bff',
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerSpacer: {
        width: 44,
        backgroundColor: '#0a0a0bff',
    },
    title: {
        textAlign: 'center',
        fontSize: 40,
        backgroundColor: '#0a0a0bff',
    },
    eventCard: {
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        width: 375,
        padding: 13,
        top: -100,
        height: 480,
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
    },
    text: {
        paddingTop: 20,
        fontSize: 30,
    },
    text2: {
        fontSize: 20,
    },

    buttrow: {
        flexDirection: 'row',
        gap: 140,
        top: -70,
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
    }
});