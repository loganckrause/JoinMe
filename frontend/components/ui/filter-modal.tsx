import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiRequest } from '@/services/api';
import type { EventFilters } from '@/services/events';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.82;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type Category = { id: number; name: string };

type FilterModalProps = {
    visible: boolean;
    onClose: () => void;
    initial: EventFilters;
    onApply: (filters: EventFilters) => void;
};

function isValidDateString(value: string): boolean {
    if (!ISO_DATE_REGEX.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && value === d.toISOString().slice(0, 10);
}

export default function FilterModal({ visible, onClose, initial, onApply }: FilterModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | undefined>(initial.categoryId);
    const [dateFromText, setDateFromText] = useState<string>(initial.dateFrom?.slice(0, 10) ?? '');
    const [dateToText, setDateToText] = useState<string>(initial.dateTo?.slice(0, 10) ?? '');
    const [radius, setRadius] = useState<number>(initial.radius ?? 50);
    const [dateError, setDateError] = useState<string | null>(null);

    const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : PANEL_WIDTH,
            duration: 280,
            useNativeDriver: true,
        }).start();
    }, [visible, slideAnim]);

    useEffect(() => {
        if (!visible) return;
        setCategoryId(initial.categoryId);
        setDateFromText(initial.dateFrom?.slice(0, 10) ?? '');
        setDateToText(initial.dateTo?.slice(0, 10) ?? '');
        setRadius(initial.radius ?? 50);
        setDateError(null);
    }, [visible, initial]);

    useEffect(() => {
        let cancelled = false;
        apiRequest<Category[]>('/categories/')
            .then((data) => {
                if (!cancelled) setCategories(data);
            })
            .catch(() => {
                // categories are non-critical; leave empty
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleApply = () => {
        const next: EventFilters = {};

        if (categoryId != null) next.categoryId = categoryId;

        if (dateFromText) {
            if (!isValidDateString(dateFromText)) {
                setDateError('Start date must be YYYY-MM-DD');
                return;
            }
            next.dateFrom = `${dateFromText}T00:00:00`;
        }
        if (dateToText) {
            if (!isValidDateString(dateToText)) {
                setDateError('End date must be YYYY-MM-DD');
                return;
            }
            next.dateTo = `${dateToText}T23:59:59`;
        }
        if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
            setDateError('Start date must be before end date');
            return;
        }

        next.radius = radius;

        setDateError(null);
        onApply(next);
        onClose();
    };

    const handleClear = () => {
        setCategoryId(undefined);
        setDateFromText('');
        setDateToText('');
        setRadius(50);
        setDateError(null);
        onApply({});
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <ThemedView style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
            >
                <ThemedView style={styles.header}>
                    <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                        Filters
                    </ThemedText>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <IconSymbol name="xmark" color="#fff" size={18} />
                    </TouchableOpacity>
                </ThemedView>

                <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                        Category
                    </ThemedText>
                    <ThemedView style={styles.chipsRow}>
                        {categories.map((cat) => {
                            const active = categoryId === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setCategoryId(active ? undefined : cat.id)}
                                    style={[styles.chip, active && styles.chipActive]}
                                    activeOpacity={0.7}
                                >
                                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                                        {cat.name}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                        {categories.length === 0 && (
                            <ThemedText style={styles.helperText}>No categories available.</ThemedText>
                        )}
                    </ThemedView>

                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                        Date range
                    </ThemedText>
                    <ThemedView style={styles.dateRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="From (YYYY-MM-DD)"
                            placeholderTextColor="#666"
                            value={dateFromText}
                            onChangeText={setDateFromText}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="To (YYYY-MM-DD)"
                            placeholderTextColor="#666"
                            value={dateToText}
                            onChangeText={setDateToText}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </ThemedView>
                    {dateError && <ThemedText style={styles.errorText}>{dateError}</ThemedText>}

                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                        Search Radius: {radius} miles
                    </ThemedText>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={5}
                        maximumValue={100}
                        step={5}
                        value={radius}
                        onValueChange={setRadius}
                        minimumTrackTintColor="#59d386ff"
                        maximumTrackTintColor="#333333"
                        thumbTintColor="#fff"
                    />
                </ScrollView>

                <ThemedView style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleClear}
                        style={[styles.button, styles.buttonSecondary]}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.buttonSecondaryText}>Clear all</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleApply}
                        style={[styles.button, styles.buttonPrimary]}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={styles.buttonPrimaryText}>Apply</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    panel: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: PANEL_WIDTH,
        backgroundColor: '#0f0f10',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        color: '#fff',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        paddingBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 12,
        marginBottom: 10,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: 'transparent',
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#1e1e1e',
    },
    chipActive: {
        backgroundColor: '#59d386ff',
    },
    chipText: {
        fontSize: 14,
        color: '#ddd',
    },
    chipTextActive: {
        color: '#0b0b0b',
        fontWeight: '600',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'transparent',
    },
    input: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 6,
    },
    helperText: {
        color: '#666',
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        gap: 10,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#2a2a2a',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#59d386ff',
    },
    buttonSecondary: {
        backgroundColor: '#1e1e1e',
    },
    buttonPrimaryText: {
        color: '#0b0b0b',
        fontWeight: '600',
        fontSize: 15,
    },
    buttonSecondaryText: {
        color: '#fff',
        fontSize: 15,
    },
});
