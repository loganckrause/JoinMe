import { StyleSheet, TouchableOpacity } from 'react-native';
import {router } from 'expo-router';
import { Fonts } from '@/constants/theme';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ChoicePage() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#151718'}}
        >
            <ThemedView style={styles.container}>
                <ThemedText style={styles.Intrtitle}>JoinMe</ThemedText>
                <ThemedView style={styles.buttRow}>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <ThemedText type="defaultSemiBold" style={styles.smlbuttcl}>Register</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <ThemedText type="defaultSemiBold" style={styles.smlbuttred}>Login</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
        </ParallaxScrollView>
    )
}

const styles = StyleSheet.create({
    Intrtitle: {
        fontSize: 60,
        textAlign: 'center',
        padding: 40,
        marginTop: 75,
        marginBottom: 30,
        fontFamily: Fonts.serif,
    },
    container: {
        gap: 16,
        marginTop: 10,
        marginBottom: 225,
    },
    buttRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    smlbuttcl: {
        textAlign: 'center',
        padding: 14,
        borderRadius: 100,
        color: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        width: 175,
    },
    smlbuttred: {
        backgroundColor: '#dd3939ff',
        textAlign: 'center',
        color: '#fff',
        padding: 14,
        borderRadius: 100,
        width: 175,
    },
});