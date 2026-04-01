import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function EventScreen() {
    const { event: eventParam } = useLocalSearchParams();
    const event = useMemo(() => JSON.parse(eventParam as string), [eventParam]);
    
    const user = {
        name: "John Doe",
        age: 26,
        city: "Philadelphia",
        interests: ["Exercise", "Sport", "Indoor"],
        about:
            "Hey, I'm John! I’m looking for a partner (or a small group) to go climbing with this Saturday. Whether you're a pro or just getting started, come hang out!",
        avatar: "https://randomuser.me/api/portraits/lego/1.jpg", 
        participants: [
            { avatar: "https://randomuser.me/api/portraits/lego/2.jpg" },
            { avatar: "https://randomuser.me/api/portraits/lego/3.jpg" },
            { avatar: "https://randomuser.me/api/portraits/lego/4.jpg" },
            { avatar: "https://randomuser.me/api/portraits/lego/5.jpg" },
            { avatar: "https://randomuser.me/api/portraits/lego/6.jpg" },
        ]
    };



    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff'}}
            headerHeight={250}
            headerImage={
                <ThemedView style={{ flex: 1 }}>
                    <Image
                        source={{ uri: event.image }}
                        style={{ width: '100%', height: '100%' }}
                    />
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backArrow}>
                        <ThemedText style={styles.bA}>←</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            }
        >
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>{event.title}</ThemedText>
                <ThemedText>{event.location}</ThemedText>
                <ThemedView style={styles.row}>
                    <Image source={{uri: user.avatar}} style={styles.pp} />
                    <ThemedView style={styles.row2}>
                        <ThemedText style={styles.title2}>{user.name}, {user.age}</ThemedText>
                        <ThemedText>Organizer</ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.nmbr}>{event.number}{' '}<IconSymbol size={35} name={"person.3"} color="#fff" /></ThemedText>
                </ThemedView>
                <ScrollView horizontal style={styles.interestsContainer}>
                    {user.interests.map((item, index) => (
                      <ThemedView key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{item}</ThemedText>
                      </ThemedView>
                  ))}
                </ScrollView>
                <ThemedText style={styles.title2}>Description</ThemedText>
                <ThemedText style={styles.txt1}>{event.description}</ThemedText>
                <ThemedText style={styles.title2}>Participants</ThemedText>
                <ScrollView horizontal style={styles.partContainer}>
                    {user.participants.map((item, index) => (
                        <Image key={index} source={{uri: item.avatar}} style={styles.pp2} />
                    ))}
                </ScrollView>
                <ThemedView style={styles.buttonRow}>
                    <TouchableOpacity style={styles.outlineBtn}>
                        <ThemedText>Message</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.grnbtn}>
                        <ThemedText>Accept</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
        </ParallaxScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: 360,
        alignSelf: 'center',
    },
    title: {
        fontSize: 30,
        textAlign: 'left',
        paddingTop: 20,
    },
    title2: {
        fontSize: 18,
    },
    nmbr: {
        fontSize: 30,
        paddingTop: 5,
        alignSelf: 'flex-start',
        textAlign: 'right',
        marginRight: 0,
    },
    row: {
        flexDirection: 'row',
        paddingTop: 30,
    },
    row2: {
        flexDirection: 'column',
        flex: 1,
    },
    interestsContainer: {
        paddingTop: 20,
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
    },
    tag: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 5,
    },
    tagText: {
        color: "#fff",
    },
    txt1: {
        paddingTop: 5,
        paddingBottom: 20,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 60,
        paddingBottom: 20,
    },
    outlineBtn: {
        borderWidth: 1,
        borderColor: "#fff",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 25,
        width: 120,
    },
    grnbtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderColor: '#59d386ff',
        width: 120,
        alignItems: 'center',
    },
    pp: {
        borderRadius: 100,
        width: 60,
        height: 60,
        marginRight: 10,
    },
    pp2: {
        borderRadius: 100,
        width: 45,
        height: 45,
        marginHorizontal: 5,
    },
    partContainer: {
        paddingTop: 12,
        paddingBottom: 35,
        flexDirection: 'row',
    },
    bA: {
        fontSize: 30,
        lineHeight: 35,
        color: '#fff',
    },
    backArrow: {
        borderRadius: 100,
        backgroundColor: 'rgba(61, 61, 61, 0.6)',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 50,
        left: 20,
    }
});