import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { useState } from 'react';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationBell } from '@/components/notification-bell';
import Sidebar from '@/components/ui/sidebar';

const MOCK_USER = {
    name: "John Doe",
    // photoUri: "https://randomuser.me/api/portraits/lego/1.jpg"
}


export default function FeedScreen() {

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
        }
    ]

    const [event, setEvent] = useState(events[0])
    const [nextEvent, setNextEvent] = useState(events[1])
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSwipeResult = () => {
        setEvent(nextEvent);
        setNextEvent(events[Math.floor(Math.random() * events.length)]);
    }

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd(() => {
            if(translateX.value > 150 || translateX.value < -150) {
                translateX.value = withSpring(translateX.value > 120 ? 500 : -500, {}, () => {
                runOnJS(handleSwipeResult)();
                translateX.value = 0;
                translateY.value = 0;
            });
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
    })

    const getIconName = (number: string) => (number === "2" ? "person.2" : "person.3");

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            
            <ThemedView style={styles.topBar}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.title}>JoinMe</ThemedText>
                <NotificationBell />
                
            </ThemedView>
            <ThemedView style={styles.container}>
                <ThemedView style={styles.eventCard}>
                    <Image source={{ uri: nextEvent.image }} style={styles.eventImage} />
                    <ThemedView style={styles.row}>
                        <ThemedText style={styles.text}>{nextEvent.title}</ThemedText>
                        <ThemedText style={styles.text}>{nextEvent.number}{' '}<IconSymbol size={35} name={"person.3"} color="#fff" /></ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.text2}>{nextEvent.location}</ThemedText>
                </ThemedView>
                <GestureDetector gesture={panGesture}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/event', params: { event: JSON.stringify(event) } })}
                    >
                        <Animated.View key={event.image} style={[styles.eventCard, animatedStyle]}>
                            <Image source={{ uri: event.image }} style={styles.eventImage} />
                            <ThemedView style={styles.row}>
                                <ThemedText style={styles.text}>{event.title}</ThemedText>
                                <ThemedText style={styles.text}>{event.number}{' '}<IconSymbol size={35} name={"person.3"} color="#fff" /></ThemedText>
                            </ThemedView>
                            <ThemedText style={styles.text2}>{event.location}</ThemedText>
                        </Animated.View>
                    </TouchableOpacity>
                </GestureDetector>
                <ThemedView style={styles.buttrow}>
                    <TouchableOpacity style={styles.nobutt} onPress={handleSwipeResult}>
                        <ThemedText style={styles.nobuttText}>X</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.yesbutt} onPress={handleSwipeResult}>
                        <ThemedText style={styles.yesbuttText}>✓</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                
            {/* Sidebar */}
            <Sidebar
                visible={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={MOCK_USER}
            />
            </ThemedView>
            
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
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
        // fontSize: 50,
        padding: 30,
        marginTop: 50,
    },
    eventCard: {
        position: 'absolute',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        width: 375,
        padding: 13,
        height: 480,
        backgroundColor: '#0a0a0bff',
        alignSelf: 'center',
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
        top: 420,
        backgroundColor: 'transparent',
        padding: 100,
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
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        
    }
});