import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EventCard, EventUser, deleteEvent, fetchEvent, fetchEventParticipants, getUserImageUri, recordSwipe } from '@/services/events';
import { useAuthStore } from '@/store/auth';

export default function EventScreen() {
    const { event: eventParam } = useLocalSearchParams();
    const token = useAuthStore((state) => state.token);
    const currentUser = useAuthStore((state) => state.user);
    const initialEvent = useMemo(() => {
        if (!eventParam || typeof eventParam !== 'string') {
            return null;
        }

        try {
            return JSON.parse(eventParam) as EventCard;
        } catch {
            return null;
        }
    }, [eventParam]);

    const [event, setEvent] = useState<EventCard | null>(initialEvent);

    const [organizer, setOrganizer] = useState<EventUser | null>(null);
    const [attendees, setAttendees] = useState<EventUser[]>([]);
    const [loadingPeople, setLoadingPeople] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [peopleError, setPeopleError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isAccepted, setIsAccepted] = useState(Boolean(event?.isAccepted));
    const isOrganizer = Boolean(
        currentUser?.id && (
            (event?.creatorId && currentUser.id === event.creatorId) ||
            (organizer?.id && currentUser.id === organizer.id)
        )
    );

    useEffect(() => {
        let mounted = true;
        setEvent(initialEvent);
        setIsAccepted(Boolean(initialEvent?.isAccepted));
        setActionError(null);

        const loadPeople = async () => {
            if (!initialEvent) {
                if (mounted) {
                    setLoadingPeople(false);
                    setPeopleError('Missing event data. Please reopen this event.');
                }
                return;
            }

            try {
                setLoadingPeople(true);
                setPeopleError(null);
                const [latestEvent, people] = await Promise.all([
                    fetchEvent(initialEvent.id, token ?? undefined),
                    fetchEventParticipants(initialEvent.id, initialEvent.creatorId),
                ]);
                if (mounted) {
                    setEvent(latestEvent);
                    setIsAccepted(Boolean(latestEvent.isAccepted));
                    setOrganizer(people.organizer);
                    setAttendees(people.attendees);
                }
            } catch (error) {
                if (mounted) {
                    setPeopleError(error instanceof Error ? error.message : 'Failed to load organizer and participants.');
                }
            } finally {
                if (mounted) {
                    setLoadingPeople(false);
                }
            }
        };

        loadPeople();

        return () => {
            mounted = false;
        };
    }, [initialEvent, token]);

    const refreshEvent = useCallback(async () => {
        if (!event) {
            return;
        }

        setRefreshing(true);
        try {
            setActionError(null);
            const [latestEvent, people] = await Promise.all([
                fetchEvent(event.id, token ?? undefined),
                fetchEventParticipants(event.id, event.creatorId),
            ]);
            setEvent(latestEvent);
            setIsAccepted(Boolean(latestEvent.isAccepted));
            setOrganizer(people.organizer);
            setAttendees(people.attendees);
            setPeopleError(null);
        } catch (error) {
            setPeopleError(error instanceof Error ? error.message : 'Failed to reload event information.');
        } finally {
            setRefreshing(false);
        }
    }, [event, token]);

    const handleSwipeAction = async (status: boolean) => {
        if (!event) {
            return;
        }

        if (!token) {
            setActionError('Please log in to change event status.');
            return;
        }

        try {
            await recordSwipe(event.id, status, token);
            setIsAccepted(status);
            setActionError(null);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to update event status.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!event) {
            return;
        }

        if (!token) {
            setActionError('Please log in to delete this event.');
            return;
        }

        Alert.alert(
            'Delete event?',
            'Are you sure you want to delete this event?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEvent(event.id, token);
                            setActionError(null);
                            router.replace('/all-events');
                        } catch (error) {
                            setActionError(error instanceof Error ? error.message : 'Failed to delete event.');
                        }
                    },
                },
            ]
        );
    };

    const navigateToProfile = (userId?: number) => {
        if (!userId) {
            return;
        }

        router.push({ pathname: '/user-profile', params: { userId, source: 'event' } });
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff'}}
            headerHeight={250}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refreshEvent} tintColor="#59d386ff" />
            }
            headerImage={
                <ThemedView style={{ flex: 1 }}>
                    <Image
                        source={{ uri: event?.image }}
                        style={{ width: '100%', height: '100%' }}
                    />
                    <TouchableOpacity testID="backbutton" activeOpacity={0.7} onPress={() => router.back()} style={styles.backArrow}>
                        <ThemedText style={styles.bA}>←</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            }
        >
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>{event?.title ?? 'Event'}</ThemedText>
                <ThemedText>{event?.location ?? '-'}</ThemedText>
                <ThemedView style={styles.row}>
                    <TouchableOpacity onPress={() => navigateToProfile(organizer?.id)} disabled={!organizer?.id}>
                        <Image source={{uri: getUserImageUri(organizer)}} style={styles.pp} />
                    </TouchableOpacity>
                    <ThemedView style={styles.row2}>
                        <ThemedText style={styles.title3}>
                            {organizer?.name ?? ''}
                            
                        </ThemedText>
                        <ThemedText>Organizer</ThemedText>
                    </ThemedView>
                    
                    <ThemedText style={styles.nmbr}>{event?.number}{' '}<IconSymbol size={35} name={"person.3"} color="#fff" /></ThemedText>
                </ThemedView>
                <ScrollView horizontal style={styles.interestsContainer}>
                                        {event?.interests?.map((item, index) => (
                      <ThemedView key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{item}</ThemedText>
                      </ThemedView>
                  ))}
                </ScrollView>
                {loadingPeople ? <ThemedText style={styles.infoText}>Loading organizer and participants...</ThemedText> : null}
                {!loadingPeople && peopleError ? <ThemedText style={styles.errorText}>{peopleError}</ThemedText> : null}
                <ThemedText style={styles.title2}>Description</ThemedText>
                <ThemedText style={styles.txt1}>{event?.description ?? 'No description available.'}</ThemedText>
                <ThemedText style={styles.title2}>Participants</ThemedText>
                <ScrollView horizontal style={styles.partContainer}>
                    {attendees.map((participant) => (
                        <TouchableOpacity key={participant.id} onPress={() => navigateToProfile(participant.id)}>
                            <Image source={{uri: getUserImageUri(participant)}} style={styles.pp2} />
                        </TouchableOpacity>
                    ))}
                    {!loadingPeople && attendees.length === 0 ? (
                        <ThemedText style={styles.infoText}>No participants yet.</ThemedText>
                    ) : null}
                </ScrollView>
                {actionError ? <ThemedText style={styles.errorText}>{actionError}</ThemedText> : null}
                <ThemedView style={styles.buttonRow}>
                    {isOrganizer ? (
                        <TouchableOpacity style={styles.redbtn} onPress={handleDeleteEvent}>
                            <ThemedText style={styles.redbtnText}>Delete</ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={isAccepted ? styles.redbtn : styles.grnbtn}
                            onPress={() => handleSwipeAction(!isAccepted)}
                        >
                            <ThemedText style={isAccepted ? styles.redbtnText : styles.grnbtnText}>
                                {isAccepted ? 'Decline' : 'Accept'}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
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
        paddingTop: 10,
    },
    title3: {
        // paddingTop: 20,
        fontSize: 18,
    },
     title2: {
        paddingTop: 20,
        fontSize: 18,
    },
    nmbr: {
        fontSize: 30,
        paddingTop: 5,
        textAlign: 'right',
        marginRight: 0,
        flexDirection: 'column',
        flex: 1,
    },
    row: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    row2: {
        flexDirection: 'column',
        flex: 1,

    },
    capacityWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    txt1: {
        paddingTop: 5,
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
    redbtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderColor: '#dd3939ff',
        width: 120,
        alignItems: 'center',
    },
    grnbtnText: {
        color: '#59d386ff',
    },
    redbtnText: {
        color: '#dd3939ff',
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
    infoText: {
        color: '#aaa',
        paddingTop: 8,
    },
    errorText: {
        color: '#f26d6d',
        paddingTop: 8,
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
    },
    interestsContainer: {
        paddingTop: 20,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    tag: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    tagText: {
        color: "#fff",
    },
});