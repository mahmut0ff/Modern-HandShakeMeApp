import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi, Order } from '@/src/api/orders';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, WorkCard, Button } from '@/components/ui';
import { formatDate } from '@/src/utils/date';

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

    const renderOrderItem = ({ item }: { item: Order }) => (
        <WorkCard
            title={item.title}
            description={item.subcategory || 'General'}
            price={item.budgetType === 'NEGOTIABLE' ? 'Negotiable' : `$${item.budgetMin || 0}${item.budgetMax ? ' - $' + item.budgetMax : ''}`}
            location={item.city}
            date={formatDate(item.createdAt)}
            status={item.status}
            applicationsCount={item.applicationsCount || 0}
            onPress={() => router.push(`/jobs/${item.id}`)}
        />
    );

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header
                title="My Jobs"
                subtitle={`${orders.length} jobs`}
                rightAction={
                    <Button
                        title="Post"
                        variant="primary"
                        size="small"
                        icon={<Ionicons name="add" size={20} color="white" />}
                        onPress={() => router.push('/create-job')}
                    />
                }
            />

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
                        <View style={styles.emptyButtonContainer}>
                            <Button
                                title="Create Your First Job"
                                variant="outline"
                                onPress={() => router.push('/create-job')}
                            />
                        </View>
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
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    emptyButtonContainer: {
        width: '80%',
    },
});
