import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    fetchNotificationPreferences,
    updateNotificationPreference,
    NotificationPreferences,
} from '@/services/notification-preferences';
import { useAuthStore } from '@/store/auth';

const MASTER = 'master';

const SECTIONS: Array<{
    title: string;
    rows: Array<{ key: string; label: string }>;
}> = [
    {
        title: 'Events',
        rows: [
            { key: 'event_updated', label: 'Event updated' },
            { key: 'event_cancelled', label: 'Event cancelled' },
        ],
    },
    {
        title: 'Attendance',
        rows: [
            { key: 'attendance_joined', label: 'Someone joined your event' },
            { key: 'attendance_left', label: 'Someone left your event' },
        ],
    },
    {
        title: 'Ratings',
        rows: [
            { key: 'user_rated', label: 'Someone rated you' },
            { key: 'event_rated', label: 'Someone rated your event' },
        ],
    },
];

const DEBOUNCE_MS = 300;

export default function NotificationSettingsScreen() {
    const token = useAuthStore(s => s.token);
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const load = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNotificationPreferences(token);
            setPrefs(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const masterMuted =
        prefs !== null && !prefs.master.in_app_enabled && !prefs.master.push_enabled;

    const scheduleUpdate = (
        key: string,
        channel: 'in_app_enabled' | 'push_enabled',
        nextValue: boolean,
        prevValue: boolean,
    ) => {
        if (!token) return;
        const timerKey = `${key}:${channel}`;
        const existing = timers.current.get(timerKey);
        if (existing) clearTimeout(existing);

        const t = setTimeout(async () => {
            try {
                await updateNotificationPreference(token, {
                    notification_type: key,
                    [channel]: nextValue,
                });
            } catch {
                // Revert on failure
                setPrefs(current => {
                    if (!current) return current;
                    return rollback(current, key, channel, prevValue);
                });
            } finally {
                timers.current.delete(timerKey);
            }
        }, DEBOUNCE_MS);
        timers.current.set(timerKey, t);
    };

    const setChannel = (
        key: string,
        channel: 'in_app_enabled' | 'push_enabled',
        value: boolean,
    ) => {
        setPrefs(current => {
            if (!current) return current;
            const prev = readChannel(current, key, channel);
            const next = writeChannel(current, key, channel, value);
            scheduleUpdate(key, channel, value, prev);
            return next;
        });
    };

    const setMasterMuted = (muted: boolean) => {
        // Master mute = both channels off. Unmute = both back on.
        setPrefs(current => {
            if (!current) return current;
            const prevInApp = current.master.in_app_enabled;
            const prevPush = current.master.push_enabled;
            const next = {
                ...current,
                master: {
                    in_app_enabled: !muted,
                    push_enabled: !muted,
                },
            };
            if (!token) return next;

            const timerKey = 'master';
            const existing = timers.current.get(timerKey);
            if (existing) clearTimeout(existing);
            const t = setTimeout(async () => {
                try {
                    await updateNotificationPreference(token, {
                        notification_type: MASTER,
                        in_app_enabled: !muted,
                        push_enabled: !muted,
                    });
                } catch {
                    setPrefs(c =>
                        c
                            ? {
                                  ...c,
                                  master: {
                                      in_app_enabled: prevInApp,
                                      push_enabled: prevPush,
                                  },
                              }
                            : c,
                    );
                } finally {
                    timers.current.delete(timerKey);
                }
            }, DEBOUNCE_MS);
            timers.current.set(timerKey, t);
            return next;
        });
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#59d386ff" />
                </View>
            </ThemedView>
        );
    }

    if (error || !prefs) {
        return (
            <ThemedView style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <ThemedText style={styles.errorText}>
                        {error ?? 'Failed to load preferences'}
                    </ThemedText>
                    <TouchableOpacity style={styles.retryButton} onPress={load}>
                        <ThemedText style={styles.retryText}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <View style={styles.rowLabel}>
                            <ThemedText style={styles.rowLabelTitle}>
                                Pause all notifications
                            </ThemedText>
                            <ThemedText style={styles.rowLabelHint}>
                                Turns off every notification regardless of the settings below.
                            </ThemedText>
                        </View>
                        <Switch
                            value={masterMuted}
                            onValueChange={setMasterMuted}
                            trackColor={{ false: '#333', true: '#59d386ff' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {SECTIONS.map(section => (
                    <View
                        key={section.title}
                        style={[styles.section, masterMuted && styles.dimmed]}
                        pointerEvents={masterMuted ? 'none' : 'auto'}
                    >
                        <ThemedText style={styles.sectionTitle}>
                            {section.title}
                        </ThemedText>
                        <View style={styles.columnHeader}>
                            <View style={styles.rowLabel} />
                            <ThemedText style={styles.columnHeaderText}>In-app</ThemedText>
                            <ThemedText style={styles.columnHeaderText}>Push</ThemedText>
                        </View>
                        {section.rows.map(r => {
                            const typePref = prefs.per_type.find(
                                p => p.notification_type === r.key,
                            );
                            const inApp = typePref?.in_app_enabled ?? true;
                            const push = typePref?.push_enabled ?? true;
                            return (
                                <View key={r.key} style={styles.row}>
                                    <View style={styles.rowLabel}>
                                        <ThemedText style={styles.rowLabelTitle}>
                                            {r.label}
                                        </ThemedText>
                                    </View>
                                    <Switch
                                        value={inApp}
                                        onValueChange={v =>
                                            setChannel(r.key, 'in_app_enabled', v)
                                        }
                                        trackColor={{ false: '#333', true: '#59d386ff' }}
                                        thumbColor="#fff"
                                    />
                                    <Switch
                                        value={push}
                                        onValueChange={v =>
                                            setChannel(r.key, 'push_enabled', v)
                                        }
                                        trackColor={{ false: '#333', true: '#59d386ff' }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </ThemedView>
    );
}

function renderHeader() {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol
                    name="chevron.right"
                    size={24}
                    color="#fff"
                    style={styles.backIcon}
                />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                Notification settings
            </ThemedText>
            <View style={{ width: 60 }} />
        </View>
    );
}

function readChannel(
    p: NotificationPreferences,
    key: string,
    channel: 'in_app_enabled' | 'push_enabled',
): boolean {
    const row = p.per_type.find(r => r.notification_type === key);
    return row ? row[channel] : true;
}

function writeChannel(
    p: NotificationPreferences,
    key: string,
    channel: 'in_app_enabled' | 'push_enabled',
    value: boolean,
): NotificationPreferences {
    const per_type = p.per_type.some(r => r.notification_type === key)
        ? p.per_type.map(r =>
              r.notification_type === key ? { ...r, [channel]: value } : r,
          )
        : [
              ...p.per_type,
              {
                  notification_type: key,
                  in_app_enabled: true,
                  push_enabled: true,
                  [channel]: value,
              } as TypePrefs,
          ];
    return { ...p, per_type };
}

type TypePrefs = NotificationPreferences['per_type'][number];

function rollback(
    p: NotificationPreferences,
    key: string,
    channel: 'in_app_enabled' | 'push_enabled',
    value: boolean,
): NotificationPreferences {
    return writeChannel(p, key, channel, value);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b0b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#0b0b0b',
    },
    backButton: {
        padding: 4,
    },
    backIcon: {
        transform: [{ scaleX: -1 }],
    },
    headerTitle: {
        fontSize: 20,
    },
    scroll: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    columnHeaderText: {
        width: 52,
        textAlign: 'center',
        fontSize: 11,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    rowLabel: {
        flex: 1,
        paddingRight: 12,
    },
    rowLabelTitle: {
        fontSize: 15,
    },
    rowLabelHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    dimmed: {
        opacity: 0.4,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#59d386ff',
    },
    retryText: {
        color: '#0b0b0b',
        fontWeight: '600',
    },
});
