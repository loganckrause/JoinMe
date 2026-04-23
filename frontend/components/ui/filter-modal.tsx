import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import DateRangePickerModal from '@/components/ui/date-range-picker-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiRequest } from '@/services/api';
import type { EventFilters } from '@/services/events';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.82;

type Category = { id: number; name: string };

type FilterModalProps = {
    visible: boolean;
    onClose: () => void;
    initial: EventFilters;
    onApply: (filters: EventFilters) => void;
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRange(from?: string, to?: string): string {
    if (!from && !to) return 'Any date';
    const f = from ? new Date(from) : undefined;
    const t = to ? new Date(to) : undefined;
    const fmt = (d: Date) => `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    if (f && t) {
        if (from!.slice(0, 10) === to!.slice(0, 10)) return fmt(f);
        return `${fmt(f)} – ${fmt(t)}`;
    }
    return fmt((f ?? t)!);
}

export default function FilterModal({ visible, onClose, initial, onApply }: FilterModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | undefined>(initial.categoryId);
    const [dateFrom, setDateFrom] = useState<string | undefined>(initial.dateFrom);
    const [dateTo, setDateTo] = useState<string | undefined>(initial.dateTo);
    const [radius, setRadius] = useState<number>(initial.radius ?? 50);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

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
        setDateFrom(initial.dateFrom);
        setDateTo(initial.dateTo);
        setRadius(initial.radius ?? 50);
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
        if (dateFrom) next.dateFrom = dateFrom;
        if (dateTo) next.dateTo = dateTo;
        next.radius = radius;
        onApply(next);
        onClose();
    };

    const handleClear = () => {
        setCategoryId(undefined);
        setDateFrom(undefined);
        setDateTo(undefined);
        setRadius(50);
        onApply({});
        onClose();
    };

    const dateLabel = useMemo(() => formatRange(dateFrom, dateTo), [dateFrom, dateTo]);
    const hasDate = !!(dateFrom || dateTo);

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
                    <TouchableOpacity
                        onPress={() => setDatePickerOpen(true)}
                        style={styles.dateButton}
                        activeOpacity={0.7}
                    >
                        <ThemedText
                            style={[styles.dateButtonText, !hasDate && styles.dateButtonTextMuted]}
                        >
                            {dateLabel}
                        </ThemedText>
                        <IconSymbol name="calendar" color="#fff" size={16} />
                    </TouchableOpacity>

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

            <DateRangePickerModal
                visible={datePickerOpen}
                onClose={() => setDatePickerOpen(false)}
                initialFrom={dateFrom}
                initialTo={dateTo}
                onApply={(from, to) => {
                    setDateFrom(from);
                    setDateTo(to);
                }}
            />
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    dateButtonTextMuted: {
        color: '#888',
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
