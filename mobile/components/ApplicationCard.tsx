import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Application {
    id: string;
    orderId: string;
    orderTitle: string;
    masterId?: string;
    masterName?: string;
    masterAvatar?: string;
    masterRating?: number;
    status: string;
    message?: string;
    createdAt: string;
}

interface ApplicationCardProps {
    application: Application;
    onPress: () => void;
    variant?: 'client' | 'master'; // client sees master info, master sees order info
}

export default function ApplicationCard({ application, onPress, variant = 'client' }: ApplicationCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return '#FF9500';
            case 'viewed':
                return '#007AFF';
            case 'accepted':
                return '#34C759';
            case 'rejected':
                return '#FF3B30';
            default:
                return theme.text + '66';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Pending';
            case 'viewed':
                return 'Viewed';
            case 'accepted':
                return 'Accepted';
            case 'rejected':
                return 'Rejected';
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
            {variant === 'client' && application.masterName && (
                <View style={styles.header}>
                    <Image
                        source={application.masterAvatar || 'https://via.placeholder.com/40'}
                        style={styles.avatar}
                    />
                    <View style={styles.masterInfo}>
                        <Text style={[styles.masterName, { color: theme.text }]}>
                            {application.masterName}
                        </Text>
                        {application.masterRating && (
                            <View style={styles.rating}>
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={[styles.ratingText, { color: theme.text + '99' }]}>
                                    {application.masterRating.toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                            {getStatusText(application.status)}
                        </Text>
                    </View>
                </View>
            )}

            {variant === 'master' && (
                <View style={styles.header}>
                    <View style={styles.orderInfo}>
                        <Text style={[styles.orderTitle, { color: theme.text }]} numberOfLines={1}>
                            {application.orderTitle}
                        </Text>
                        <Text style={[styles.timeText, { color: theme.text + '66' }]}>
                            {getTimeAgo(application.createdAt)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                            {getStatusText(application.status)}
                        </Text>
                    </View>
                </View>
            )}

            {application.message && (
                <Text style={[styles.message, { color: theme.text + '99' }]} numberOfLines={2}>
                    {application.message}
                </Text>
            )}

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.tint }]}>View Details</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.tint} />
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    masterInfo: {
        flex: 1,
    },
    masterName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
    },
    orderInfo: {
        flex: 1,
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
