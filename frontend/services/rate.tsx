import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/auth';
import { AppUser } from '@/services/user';
import { EventCard } from '@/services/events';
import {
    fetchEventForRating,
    fetchEventParticipants,
    submitEventRating,
    submitUserRating,
} from '@/services/ratings';

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
    return (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7} style={styles.starTouch}>
                    <IconSymbol
                        name={star <= rating ? 'star.fill' : 'star'}
                        size={36}
                        color={star <= rating ? '#f5c518' : '#444'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function RateEventScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const eventId = Number(id);
    const router = useRouter();
    
    const token = useAuthStore(s => s.token);
    const currentUser = useAuthStore(s => s.user);

    const [event, setEvent] = useState<EventCard | null>(null);
    const [participants, setParticipants] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [eventRating, setEventRating] = useState<number>(0);
    const [userRatings, setUserRatings] = useState<Record<number, number>>({});

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            if (!token || !eventId) return;
            
            try {
                setLoading(true);
                const [fetchedEvent, fetchedParticipants] = await Promise.all([
                    fetchEventForRating(token, eventId),
                    fetchEventParticipants(token, eventId)
                ]);
                
                if (mounted) {
                    setEvent(fetchedEvent);
                    // Filter out the current user so they don't rate themselves
                    setParticipants(fetchedParticipants.filter(p => p.id !== currentUser?.id));
                }
            } catch (err) {
                if (mounted) {
                    Alert.alert('Error', 'Could not load event data for rating.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();
        return () => { mounted = false; };
    }, [eventId, token, currentUser?.id]);

    const handleUserRatingChange = (userId: number, rating: number) => {
        setUserRatings(prev => ({ ...prev, [userId]: rating }));
    };

    const handleSubmit = async () => {
        if (!token) return;
        
        if (eventRating === 0) {
            Alert.alert('Missing Rating', 'Please provide a rating for the event before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Submit Event Rating
            await submitEventRating(token, eventId, eventRating);

            // 2. Submit Participant Ratings (Only submit the ones that were actually rated)
            const ratingPromises = Object.entries(userRatings).map(([userIdStr, rating]) => {
                if (rating > 0) {
                    return submitUserRating(token, Number(userIdStr), eventId, rating);
                }
                return Promise.resolve();
            });

            await Promise.all(ratingPromises);
            
            Alert.alert('Success', 'Thank you for your feedback!');
            router.back();
        } catch (e) {
            Alert.alert('Error', (e as Error).message || 'Failed to submit ratings.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#59d386ff" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.right" size={24} color="#fff" style={styles.backIcon} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Rate Experience</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {event && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>How was the event?</ThemedText>
                        <View style={styles.eventCard}>
                            {event.image ? (
                                <Image source={{ uri: event.image }} style={styles.eventImage} />
                            ) : (
                                <View style={[styles.eventImage, styles.placeholderImage]} />
                            )}
                            <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                        </View>
                        <StarRating rating={eventRating} onChange={setEventRating} />
                    </View>
                )}

                {participants.length > 0 && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>Rate the participants</ThemedText>
                            {participants.map(p => (
                                <View key={p.id} style={styles.participantRow}>
                                    <View style={styles.participantInfo}>
                                        {p.photoUri ? (
                                            <Image source={{ uri: p.photoUri }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatar, styles.placeholderImage]} />
                                        )}
                                        <ThemedText style={styles.participantName}>{p.name}</ThemedText>
                                    </View>
                                    <StarRating 
                                        rating={userRatings[p.id] || 0} 
                                        onChange={(r) => handleUserRatingChange(p.id, r)} 
                                    />
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#0b0b0b" />
                    ) : (
                        <ThemedText style={styles.submitButtonText}>Submit Ratings</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b0b' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0b0b' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#0b0b0b' },
    backButton: { padding: 4 },
    backIcon: { transform: [{ scaleX: -1 }] },
    headerTitle: { fontSize: 20, color: '#fff' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    section: { alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 20 },
    eventCard: { alignItems: 'center', marginBottom: 20 },
    eventImage: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
    placeholderImage: { backgroundColor: '#333' },
    eventTitle: { fontSize: 18, color: '#ddd', textAlign: 'center' },
    starRow: { flexDirection: 'row', gap: 10 },
    starTouch: { padding: 4 },
    divider: { height: 1, backgroundColor: '#333', marginVertical: 30, width: '100%' },
    participantRow: { width: '100%', backgroundColor: '#161616', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
    participantInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%', justifyContent: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    participantName: { fontSize: 18, color: '#fff', fontWeight: '500' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#0b0b0b',
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    submitButton: {
        backgroundColor: '#59d386ff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: { color: '#0b0b0b', fontSize: 18, fontWeight: '700' },
});