import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DashboardCardProps {
    title: string;
    badge?: number;
    onActionPress?: () => void;
    actionText?: string;
    children: React.ReactNode;
}

export default function DashboardCard({
    title,
    badge,
    onActionPress,
    actionText,
    children
}: DashboardCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    {badge !== undefined && badge > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                        </View>
                    )}
                </View>
                {onActionPress && actionText && (
                    <TouchableOpacity onPress={onActionPress}>
                        <Text style={[styles.actionText, { color: theme.tint }]}>{actionText}</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});
