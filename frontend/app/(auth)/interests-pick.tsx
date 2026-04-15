import { StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { BackButton } from '@/components/back-button';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';


const INTERESTS = [
    { id: '1', label: 'Exercise' },
    { id: '2', label: 'Sport' },
    { id: '3', label: 'Indoor' },
    { id: '4', label: 'Outdoor' },
    { id: '5', label: 'Running' },
    { id: '6', label: 'Cycling' },
    { id: '7', label: 'Swimming' },
    { id: '8', label: 'Yoga' },
    { id: '9', label: 'Hiking' },
    { id: '10', label: 'Team Sports' },
    { id: '11', label: 'Martial Arts' },
    { id: '12', label: 'Dance' },
    { id: '13', label: 'Rock Climbing' },
    { id: '14', label: 'CrossFit' },
    { id: '15', label: 'Weightlifting' },
];

const MAX_SELECTIONS = 5;

export default function InterestsScreen() {
    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (id: string) => {
        setSelected(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= MAX_SELECTIONS) return prev;
            return [...prev, id];
        });
    };

    const canProceed = selected.length >= 1;

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff' }}
        >
            <BackButton />
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Choose your{'\n'}interests</ThemedText>

                <ThemedView style={styles.pillsContainer}>
                    {INTERESTS.map(item => {
                        const isSelected = selected.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggle(item.id)}
                                style={[
                                    styles.pill,
                                    isSelected && styles.pillSelected,
                                ]}
                                activeOpacity={0.7}
                            >
                                <ThemedText
                                    style={[
                                        styles.pillText,
                                        isSelected && styles.pillTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ThemedView>

                <ThemedText style={styles.counter}>
                    {selected.length}/{MAX_SELECTIONS} selected
                </ThemedText>
            </ThemedView>

            <TouchableOpacity
                onPress={() => canProceed && router.push('/complete-profile')}
                style={[styles.button, !canProceed && styles.buttonDisabled]}
                activeOpacity={canProceed ? 0.8 : 1}
            >
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                    Next
                </ThemedText>
            </TouchableOpacity>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
        marginTop: 10,
        marginBottom: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 4,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    pill: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 100,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    pillSelected: {
        borderColor: '#59d386ff',
        backgroundColor: 'transparent',
    },
    pillText: {
        color: '#fff',
        fontSize: 14,
    },
    pillTextSelected: {
        color: '#59d386ff',
    },
    counter: {
        textAlign: 'center',
        color: '#555',
        fontSize: 13,
        marginTop: 4,
    },
    button: {
        backgroundColor: '#59d386ff',
        padding: 14,
        borderRadius: 100,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonDisabled: {
        backgroundColor: '#2a6b42',
        opacity: 0.5,
    },
    buttonText: {
        textAlign: 'center',
        color: '#fff',
    },
});