import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CalendarDay {
    date: Date;
    hasWork: boolean;
    isToday: boolean;
}

interface MiniCalendarProps {
    workDates: string[]; // ISO date strings
    onDayPress?: (date: Date) => void;
}

export default function MiniCalendar({ workDates, onDayPress }: MiniCalendarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getNext7Days = (): CalendarDay[] => {
        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dateStr = date.toISOString().split('T')[0];
            const hasWork = workDates.some(wd => wd.startsWith(dateStr));
            
            days.push({
                date,
                hasWork,
                isToday: i === 0
            });
        }

        return days;
    };

    const days = getNext7Days();
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {days.map((day, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.dayContainer,
                        { backgroundColor: day.isToday ? theme.tint : theme.card },
                        day.hasWork && !day.isToday && { borderWidth: 2, borderColor: theme.tint }
                    ]}
                    onPress={() => onDayPress?.(day.date)}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.weekDay,
                        { color: day.isToday ? 'white' : theme.text + '66' }
                    ]}>
                        {weekDays[day.date.getDay()]}
                    </Text>
                    <Text style={[
                        styles.dayNumber,
                        { color: day.isToday ? 'white' : theme.text }
                    ]}>
                        {day.date.getDate()}
                    </Text>
                    {day.hasWork && (
                        <View style={[
                            styles.indicator,
                            { backgroundColor: day.isToday ? 'white' : theme.tint }
                        ]} />
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        gap: 8,
    },
    dayContainer: {
        width: 50,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    weekDay: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 6,
    },
});
