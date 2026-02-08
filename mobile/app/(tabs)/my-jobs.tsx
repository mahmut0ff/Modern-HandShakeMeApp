import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi, Order } from '@/src/api/orders';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MyJobsScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchOrders = useCallback(async () => {
        try {
            const response = await ordersApi.getMyOrders();
            setOrders(response.data.results);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return '#34C759';
            case 'IN_PROGRESS': return '#007AFF';
            case 'COMPLETED': return '#8E8E93';
            case 'CANCELLED': return '#FF3B30';
            case 'DRAFT': return '#FF9500';
            default: return '#8E8E93';
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: theme.card }]}
            onPress={() => {/* TODO: Navigate to job details */ }}
        >
            <View style={styles.orderHeader}>
                <Text style={[styles.orderTitle, { color: theme.text }]}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <Text style={[styles.orderDescription, { color: theme.text + '99' }]} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.orderFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.city}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="people-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.applicationsCount} apps</Text>
                </View>
                <Text style={[styles.orderBudget, { color: theme.tint }]}>
                    {item.budgetType === 'NEGOTIABLE' ? 'Negotiable' : `$${item.budgetMin || 0}${item.budgetMax ? ' - $' + item.budgetMax : ''}`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>My Jobs</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/create-job')}
                >
                    <Ionicons name="add" size={24} color={theme.onPrimary} />
                    <Text style={[styles.addButtonText, { color: theme.onPrimary }]}>Post a Job</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="briefcase-outline" size={60} color={theme.text + '33'} />
                        <Text style={[styles.emptyText, { color: theme.text + '66' }]}>No jobs posted yet.</Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { borderColor: theme.tint }]}
                            onPress={() => router.push('/create-job')}
                        >
                            <Text style={[styles.emptyButtonText, { color: theme.tint }]}>Create Your First Job</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    orderCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    footerText: {
        fontSize: 12,
        marginLeft: 4,
    },
    orderBudget: {
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 20,
    },
    emptyButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
