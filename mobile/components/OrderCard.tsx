import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Order {
    id: string;
    title: string;
    status: string;
    applicationCount?: number;
    budget?: string;
    city?: string;
    createdAt: string;
}

interface OrderCardProps {
    order: Order;
    onPress: () => void;
    showApplicationCount?: boolean;
}

export default function OrderCard({ order, onPress, showApplicationCount = true }: OrderCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'awaiting_master':
                return '#FF9500';
            case 'in_progress':
                return '#007AFF';
            case 'completed':
                return '#34C759';
            case 'cancelled':
                return '#FF3B30';
            default:
                return theme.text + '66';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Pending';
            case 'awaiting_master':
                return 'Awaiting Master';
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.background, borderColor: theme.text + '10' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                    {order.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusText(order.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.info}>
                {order.city && (
                    <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
                        <Text style={[styles.infoText, { color: theme.text + '66' }]}>{order.city}</Text>
                    </View>
                )}
                {order.budget && (
                    <View style={styles.infoItem}>
                        <Ionicons name="cash-outline" size={14} color={theme.text + '66'} />
                        <Text style={[styles.infoText, { color: theme.text + '66' }]}>{order.budget}</Text>
                    </View>
                )}
                <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.infoText, { color: theme.text + '66' }]}>
                        {getTimeAgo(order.createdAt)}
                    </Text>
                </View>
            </View>

            {showApplicationCount && order.applicationCount !== undefined && (
                <View style={styles.footer}>
                    <View style={styles.applicationCount}>
                        <Ionicons name="people-outline" size={16} color={theme.tint} />
                        <Text style={[styles.applicationCountText, { color: theme.tint }]}>
                            {order.applicationCount} {order.applicationCount === 1 ? 'application' : 'applications'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    info: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    applicationCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    applicationCountText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
