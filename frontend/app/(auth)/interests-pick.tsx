import { StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { BackButton } from '@/components/back-button';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/services/config';
import { asSingleParam } from '@/services/signup-flow';


type Category = {
    id: number;
    name: string;
};

const MAX_SELECTIONS = 5;

export default function InterestsScreen() {
    const params = useLocalSearchParams<{
        email?: string;
        password?: string;
        fullName?: string;
        age?: string;
    }>();
    const [selected, setSelected] = useState<number[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const email = asSingleParam(params.email);
    const password = asSingleParam(params.password);
    const fullName = asSingleParam(params.fullName);
    const age = asSingleParam(params.age);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch(`${API_URL}/categories/`);
                if (!response.ok) {
                    throw new Error(`Failed to load categories (${response.status})`);
                }
                const data = (await response.json()) as Category[];
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load interests';
                setLoadError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const toggle = (id: number) => {
        setSelected(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= MAX_SELECTIONS) return prev;
            return [...prev, id];
        });
    };

    const signupDataMissing = useMemo(
        () => !email || !password || !fullName || !age,
        [age, email, fullName, password]
    );

    const canProceed = selected.length >= 1 && !signupDataMissing;

    const handleNext = () => {
        if (!canProceed) {
            return;
        }

        router.push({
            pathname: '/complete-profile',
            params: {
                email,
                password,
                fullName,
                age,
                categoryIds: JSON.stringify(selected),
            },
        });
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff' }}
        >
            <BackButton />
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Choose your{'\n'}interests</ThemedText>

                <ThemedView style={styles.pillsContainer}>
                    {isLoading && (
                        <ThemedText style={styles.counter}>Loading interests...</ThemedText>
                    )}
                    {!isLoading && loadError && (
                        <ThemedText style={styles.errorText}>{loadError}</ThemedText>
                    )}
                    {!isLoading && !loadError && categories.map(item => {
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
                                    {item.name}
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
                onPress={handleNext}
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
    errorText: {
        textAlign: 'center',
        color: '#d9534f',
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