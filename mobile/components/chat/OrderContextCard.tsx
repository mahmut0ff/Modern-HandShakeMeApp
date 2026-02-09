import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderContextCardProps {
    orderTitle: string;
    orderStatus: string;
    orderPrice?: number;
    onPress: () => void;
    theme: any;
}

export default function OrderContextCard({ orderTitle, orderStatus, orderPrice, onPress, theme }: OrderContextCardProps) {
    const getStatusColor = () => {
        switch (orderStatus) {
            case 'ASSIGNED':
            case 'IN_PROGRESS':
                return '#3B82F6';
            case 'COMPLETED':
                return '#10B981';
            case 'CANCELLED':
                return '#EF4444';
            default:
                return theme.text + '66';
        }
    };

    const getStatusText = () => {
        switch (orderStatus) {
            case 'ASSIGNED':
                return 'Заказ назначен';
            case 'IN_PROGRESS':
                return 'В работе';
            case 'COMPLETED':
                return 'Завершён';
            case 'CANCELLED':
                return 'Отменён';
            default:
                return orderStatus;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.text + '10' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Ionicons name="briefcase-outline" size={20} color={theme.tint} />
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {orderTitle}
                </Text>
            </View>

            <View style={styles.cardContent}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                </View>

                {orderPrice && (
                    <Text style={[styles.priceText, { color: theme.text }]}>
                        ${orderPrice}
                    </Text>
                )}
            </View>

            <View style={styles.cardFooter}>
                <Text style={[styles.linkText, { color: theme.tint }]}>
                    Открыть заказ
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.tint} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
});
