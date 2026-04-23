import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useEffect, useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const ACCENT = '#59d386ff';
const ACCENT_SOFT = 'rgba(89, 211, 134, 0.22)';
const PANEL_BG = '#0f0f10';
const TEXT_PRIMARY = '#fff';
const TEXT_MUTED = '#aaa';
const TEXT_DISABLED = '#555';

type DateRangePickerModalProps = {
    visible: boolean;
    onClose: () => void;
    initialFrom?: string;
    initialTo?: string;
    onApply: (from: string | undefined, to: string | undefined) => void;
};

function toYmd(iso?: string): string | undefined {
    if (!iso) return undefined;
    return iso.slice(0, 10);
}

function buildMarkedDates(from?: string, to?: string) {
    if (!from && !to) return {};
    if (from && !to) {
        return {
            [from]: {
                startingDay: true,
                endingDay: true,
                color: ACCENT,
                textColor: '#0b0b0b',
            },
        };
    }
    if (from && to && from === to) {
        return {
            [from]: {
                startingDay: true,
                endingDay: true,
                color: ACCENT,
                textColor: '#0b0b0b',
            },
        };
    }
    const marks: Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor: string }> = {};
    const start = new Date(from!);
    const end = new Date(to!);
    const cursor = new Date(start);
    while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10);
        const isStart = key === from;
        const isEnd = key === to;
        marks[key] = {
            startingDay: isStart,
            endingDay: isEnd,
            color: isStart || isEnd ? ACCENT : ACCENT_SOFT,
            textColor: isStart || isEnd ? '#0b0b0b' : TEXT_PRIMARY,
        };
        cursor.setDate(cursor.getDate() + 1);
    }
    return marks;
}

export default function DateRangePickerModal({
    visible,
    onClose,
    initialFrom,
    initialTo,
    onApply,
}: DateRangePickerModalProps) {
    const [from, setFrom] = useState<string | undefined>(toYmd(initialFrom));
    const [to, setTo] = useState<string | undefined>(toYmd(initialTo));

    useEffect(() => {
        if (!visible) return;
        setFrom(toYmd(initialFrom));
        setTo(toYmd(initialTo));
    }, [visible, initialFrom, initialTo]);

    const markedDates = useMemo(() => buildMarkedDates(from, to), [from, to]);

    const handleDayPress = (day: DateData) => {
        const picked = day.dateString;
        if (!from || (from && to)) {
            setFrom(picked);
            setTo(undefined);
            return;
        }
        if (picked < from) {
            setFrom(picked);
            setTo(undefined);
            return;
        }
        setTo(picked);
    };

    const handleClear = () => {
        setFrom(undefined);
        setTo(undefined);
    };

    const handleApply = () => {
        const fromIso = from ? `${from}T00:00:00` : undefined;
        const toIso = (to ?? from) ? `${to ?? from}T23:59:59` : undefined;
        onApply(fromIso, toIso);
        onClose();
    };

    const summary = useMemo(() => {
        if (!from) return 'Pick a start date';
        if (!to) return 'Pick an end date';
        if (from === to) return from;
        return `${from} — ${to}`;
    }, [from, to]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <ThemedView style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <ThemedView style={styles.sheetWrap} pointerEvents="box-none">
                <ThemedView style={styles.sheet}>
                    <ThemedView style={styles.header}>
                        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                            Select dates
                        </ThemedText>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <IconSymbol name="xmark" color={TEXT_PRIMARY} size={18} />
                        </TouchableOpacity>
                    </ThemedView>

                    <ThemedText style={styles.summary}>{summary}</ThemedText>

                    <Calendar
                        onDayPress={handleDayPress}
                        markingType="period"
                        markedDates={markedDates}
                        firstDay={1}
                        enableSwipeMonths
                        theme={{
                            calendarBackground: PANEL_BG,
                            backgroundColor: PANEL_BG,
                            dayTextColor: TEXT_PRIMARY,
                            monthTextColor: TEXT_PRIMARY,
                            textSectionTitleColor: TEXT_MUTED,
                            textDisabledColor: TEXT_DISABLED,
                            arrowColor: ACCENT,
                            todayTextColor: ACCENT,
                            selectedDayBackgroundColor: ACCENT,
                            selectedDayTextColor: '#0b0b0b',
                            textDayFontWeight: '500',
                            textMonthFontWeight: '600',
                            textDayHeaderFontWeight: '600',
                        }}
                        style={styles.calendar}
                    />

                    <ThemedView style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleClear}
                            style={[styles.button, styles.buttonSecondary]}
                            activeOpacity={0.7}
                        >
                            <ThemedText style={styles.buttonSecondaryText}>Clear</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleApply}
                            style={[styles.button, styles.buttonPrimary]}
                            activeOpacity={0.7}
                            disabled={!from}
                        >
                            <ThemedText style={[styles.buttonPrimaryText, !from && styles.buttonTextDisabled]}>
                                Apply
                            </ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheetWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'transparent',
    },
    sheet: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: PANEL_BG,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 18,
        paddingBottom: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#2a2a2a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 17,
        color: TEXT_PRIMARY,
    },
    summary: {
        color: TEXT_MUTED,
        fontSize: 13,
        paddingHorizontal: 4,
        marginTop: 4,
        marginBottom: 8,
    },
    calendar: {
        backgroundColor: PANEL_BG,
        borderRadius: 12,
    },
    footer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
        paddingHorizontal: 4,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: ACCENT,
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
        color: TEXT_PRIMARY,
        fontSize: 15,
    },
    buttonTextDisabled: {
        opacity: 0.5,
    },
});
