import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi, Order } from '@/src/api/orders';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function JobsScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        categoryId: '',
        budget_min: '',
        is_urgent: false,
    });
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchOrders = useCallback(async (query?: string, currentFilters?: typeof filters) => {
        try {
            const params: any = { status: 'ACTIVE' };
            if (query) params.search = query;
            if (currentFilters?.categoryId) params.category = currentFilters.categoryId;
            if (currentFilters?.budget_min) params.budget_min = currentFilters.budget_min;
            if (currentFilters?.is_urgent) params.is_urgent = true;

            const response = await ordersApi.listOrders(params);
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
        fetchOrders(searchQuery);
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        fetchOrders(text, filters);
    };

    const applyFilters = () => {
        setIsFilterVisible(false);
        fetchOrders(searchQuery, filters);
    };

    const resetFilters = () => {
        const reset = { categoryId: '', budget_min: '', is_urgent: false };
        setFilters(reset);
        setIsFilterVisible(false);
        fetchOrders(searchQuery, reset);
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: theme.card }]}
            onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}
        >
            <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.orderTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    {item.subcategory && (
                        <Text style={[styles.orderSubcat, { color: theme.tint }]}>{item.subcategory}</Text>
                    )}
                </View>
                {item.isUrgent && (
                    <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.orderDescription, { color: theme.text + '99' }]} numberOfLines={2}>
                {item.description}
            </Text>

            {item.workVolume && (
                <View style={styles.volumeRow}>
                    <Ionicons name="cube-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.volumeText, { color: theme.text + '66' }]}>{item.workVolume}</Text>
                </View>
            )}

            <View style={styles.orderFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.city}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="eye-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.viewsCount || 0}</Text>
                </View>
                <View style={[styles.footerItem, { marginRight: 0 }]}>
                    <Ionicons name="people-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.footerText, { color: theme.text + '66' }]}>{item.applicationsCount}</Text>
                </View>
                <Text style={[styles.orderBudget, { color: theme.tint }]}>
                    {item.budgetType === 'NEGOTIABLE' ? 'Neg.' : `$${item.budgetMin}`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Browse Jobs</Text>
                <View style={styles.searchRow}>
                    <View style={[styles.searchContainer, { backgroundColor: theme.text + '05' }]}>
                        <Ionicons name="search" size={20} color={theme.text + '66'} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search jobs..."
                            placeholderTextColor={theme.text + '66'}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterBtn, { backgroundColor: filters.categoryId || filters.budget_min || filters.is_urgent ? theme.tint : theme.text + '05' }]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <Ionicons name="options-outline" size={24} color={filters.categoryId || filters.budget_min || filters.is_urgent ? '#fff' : theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
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
                            <Ionicons name="search-outline" size={60} color={theme.text + '33'} />
                            <Text style={[styles.emptyText, { color: theme.text + '66' }]}>No jobs found.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={isFilterVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
                            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.filterLabel, { color: theme.text }]}>Min Budget ($)</Text>
                        <TextInput
                            style={[styles.filterInput, { color: theme.text, borderColor: theme.text + '10' }]}
                            placeholder="e.g. 50"
                            placeholderTextColor={theme.text + '33'}
                            keyboardType="numeric"
                            value={filters.budget_min}
                            onChangeText={text => setFilters({ ...filters, budget_min: text })}
                        />

                        <TouchableOpacity
                            style={styles.urgentFilterRow}
                            onPress={() => setFilters({ ...filters, is_urgent: !filters.is_urgent })}
                        >
                            <View style={[styles.checkbox, filters.is_urgent && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}>
                                {filters.is_urgent && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={[styles.filterLabel, { color: theme.text, marginBottom: 0 }]}>URGENT only</Text>
                        </TouchableOpacity>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.text + '20' }]} onPress={resetFilters}>
                                <Text style={[styles.resetBtnText, { color: theme.text }]}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.primary }]} onPress={applyFilters}>
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 45,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
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
        alignItems: 'center',
        marginBottom: 8,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    urgentBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    urgentText: {
        color: '#fff',
        fontSize: 10,
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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBtn: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    orderSubcat: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    volumeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    volumeText: {
        fontSize: 12,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    filterInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    urgentFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
    },
    resetBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    resetBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    applyBtn: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
