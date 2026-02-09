import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DateSeparatorProps {
    date: string;
    theme: any;
}

export default function DateSeparator({ date, theme }: DateSeparatorProps) {
    const formatDate = (isoString: string) => {
        const messageDate = new Date(isoString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time for comparison
        const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (messageDateOnly.getTime() === todayOnly.getTime()) {
            return 'Today';
        } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.badge, { backgroundColor: theme.text + '10' }]}>
                <Text style={[styles.text, { color: theme.text + '66' }]}>
                    {formatDate(date)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
});
