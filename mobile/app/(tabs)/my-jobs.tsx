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
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'>('ACTIVE');
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchOrders = useCallback(async () => {
        try {
            // Map our UI tabs to API statuses if needed, though they mostly match
            const response = await ordersApi.getMyOrders(activeTab);
            setOrders(response.data.results);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setIsLoading(true);
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
            case 'READY_TO_CONFIRM': return '#5856D6';
            case 'COMPLETED': return '#8E8E93';
            case 'CANCELLED': return '#FF3B30';
            case 'PAUSED': return '#FF9500';
            case 'DRAFT': return '#FF9500';
            default: return '#8E8E93';
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/jobs/${item.id}`)}
        >
            <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.orderTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.orderSubcategory, { color: theme.text + '66' }]}>
                        {item.subcategory || 'General'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={16} color={theme.text + '99'} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{item.viewsCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.text + '66' }]}>views</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="chatbubble-outline" size={16} color={theme.text + '99'} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{item.applicationsCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: theme.text + '66' }]}>responses</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={16} color={theme.text + '99'} />
                    <Text style={[styles.statValue, { color: theme.text }]}>0</Text>
                    <Text style={[styles.statLabel, { color: theme.text + '66' }]}>favs</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.city}</Text>
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
                    <Text style={[styles.addButtonText, { color: theme.onPrimary }]}>Post</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                {(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { borderBottomColor: theme.tint, borderBottomWidth: 2 }
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? theme.tint : theme.text + '66' }
                        ]}>
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
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
        paddingBottom: 10,
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
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 20,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
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
        marginBottom: 12,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    orderSubcategory: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 10,
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        marginLeft: 4,
    },
    orderBudget: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    emptyButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
