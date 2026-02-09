import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi, Order } from '@/src/api/orders';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, SearchBar, WorkCard } from '@/components/ui';
import { formatDate } from '@/src/utils/date';

export default function JobsScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        categoryId: '',
        budget_min: '',
        budget_max: '',
        is_urgent: false,
        city: '',
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
            if (currentFilters?.budget_max) params.budget_max = currentFilters.budget_max;
            if (currentFilters?.city) params.city = currentFilters.city;
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
        const reset = { categoryId: '', budget_min: '', budget_max: '', is_urgent: false, city: '' };
        setFilters(reset);
        setIsFilterVisible(false);
        fetchOrders(searchQuery, reset);
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
            const priceDisplay = item.budgetType === 'NEGOTIABLE' 
                ? 'Договорная' 
                : item.budgetMin && item.budgetMax 
                    ? `$${item.budgetMin} - $${item.budgetMax}`
                    : item.budgetMin 
                        ? `от $${item.budgetMin}`
                        : 'Не указана';

            return (
                <WorkCard
                    title={item.title || 'Без названия'}
                    description={item.description}
                    price={priceDisplay}
                    location={item.city || 'Не указан'}
                    date={formatDate(item.createdAt)}
                    status={item.status}
                    urgent={item.isUrgent}
                    applicationsCount={item.applicationsCount || 0}
                    onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}
                />
            );
        };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Browse Jobs" />
            
            <View style={styles.searchContainer}>
                <View style={{ flex: 1 }}>
                    <SearchBar
                        placeholder="Search jobs..."
                        onSearch={handleSearch}
                        value={searchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: filters.categoryId || filters.budget_min || filters.is_urgent ? theme.tint : theme.text + '05' }]}
                    onPress={() => setIsFilterVisible(true)}
                >
                    <Ionicons name="options-outline" size={24} color={filters.categoryId || filters.budget_min || filters.is_urgent ? '#fff' : theme.text} />
                </TouchableOpacity>
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

                        <Text style={[styles.filterLabel, { color: theme.text }]}>Город</Text>
                        <TextInput
                            style={[styles.filterInput, { color: theme.text, borderColor: theme.text + '10' }]}
                            placeholder="Например: Бишкек"
                            placeholderTextColor={theme.text + '33'}
                            value={filters.city}
                            onChangeText={text => setFilters({ ...filters, city: text })}
                        />

                        <Text style={[styles.filterLabel, { color: theme.text }]}>Бюджет ($)</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            <TextInput
                                style={[styles.filterInput, { color: theme.text, borderColor: theme.text + '10', flex: 1, marginBottom: 0 }]}
                                placeholder="От"
                                placeholderTextColor={theme.text + '33'}
                                keyboardType="numeric"
                                value={filters.budget_min}
                                onChangeText={text => setFilters({ ...filters, budget_min: text })}
                            />
                            <TextInput
                                style={[styles.filterInput, { color: theme.text, borderColor: theme.text + '10', flex: 1, marginBottom: 0 }]}
                                placeholder="До"
                                placeholderTextColor={theme.text + '33'}
                                keyboardType="numeric"
                                value={filters.budget_max}
                                onChangeText={text => setFilters({ ...filters, budget_max: text })}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.urgentFilterRow}
                            onPress={() => setFilters({ ...filters, is_urgent: !filters.is_urgent })}
                        >
                            <View style={[styles.checkbox, filters.is_urgent && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}>
                                {filters.is_urgent && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={[styles.filterLabel, { color: theme.text, marginBottom: 0 }]}>Только срочные</Text>
                        </TouchableOpacity>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.text + '20' }]} onPress={resetFilters}>
                                <Text style={[styles.resetBtnText, { color: theme.text }]}>Сбросить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.primary }]} onPress={applyFilters}>
                                <Text style={styles.applyBtnText}>Применить</Text>
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
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        alignItems: 'center',
    },
    filterBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 20,
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
