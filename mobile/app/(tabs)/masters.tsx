import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { mastersApi, MasterProfile } from '@/src/api/masters';
import { categoriesApi, Category } from '@/src/api/categories';
import { chatApi } from '@/src/api/chat';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import MasterCard from '@/components/MasterCard';

export default function MastersScreen() {
    const [masters, setMasters] = useState<MasterProfile[]>([]);
    const [filteredMasters, setFilteredMasters] = useState<MasterProfile[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [minRating, setMinRating] = useState<number>(0);
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchCategories = useCallback(async () => {
        try {
            const response = await categoriesApi.listCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    }, []);

    const fetchMasters = useCallback(async () => {
        try {
            const params: any = {
                with_portfolio: true,
                page_size: 100,
            };

            if (selectedCategory) {
                params.category_id = selectedCategory.toString();
            }
            if (selectedCity) {
                params.city = selectedCity;
            }
            if (minRating > 0) {
                params.min_rating = minRating;
            }
            if (showAvailableOnly) {
                params.is_available = true;
            }

            const response = await mastersApi.listMasters(params);
            const mastersData = response.data || [];
            setMasters(mastersData);
            applySearch(mastersData, searchQuery);
        } catch (error) {
            console.error('Failed to fetch masters', error);
            setMasters([]);
            setFilteredMasters([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, selectedCity, minRating, showAvailableOnly, searchQuery]);

    const applySearch = (mastersData: MasterProfile[], query: string) => {
        if (!query.trim()) {
            setFilteredMasters(mastersData);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = mastersData.filter(master => {
            const fullName = `${master.firstName || ''} ${master.lastName || ''}`.toLowerCase();
            const bio = (master.bio || '').toLowerCase();
            const city = (master.city || '').toLowerCase();
            return fullName.includes(lowerQuery) || bio.includes(lowerQuery) || city.includes(lowerQuery);
        });
        setFilteredMasters(filtered);
    };

    useEffect(() => {
        fetchCategories();
        fetchMasters();
    }, []);

    useEffect(() => {
        fetchMasters();
    }, [selectedCategory, selectedCity, minRating, showAvailableOnly]);

    useEffect(() => {
        applySearch(masters, searchQuery);
    }, [searchQuery, masters]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMasters();
    };

    const handleMasterPress = (id: string) => {
        router.push(`/masters/${id}` as any);
    };

    const handleWrite = async (masterId: string) => {
        if (!user) return;
        try {
            const response = await chatApi.createRoom({
                participants: [user.id, masterId],
            });
            router.push(`/chat/${response.data.id}` as any);
        } catch (error) {
            console.error('Failed to create chat room', error);
            Alert.alert('Ошибка', 'Не удалось начать чат');
        }
    };

    const handleCreateOrder = (masterId: string) => {
        router.push({
            pathname: '/create-job',
            params: { masterId }
        } as any);
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedCity('');
        setMinRating(0);
        setShowAvailableOnly(false);
        setSearchQuery('');
    };

    const hasActiveFilters = selectedCategory !== null || selectedCity !== '' || minRating > 0 || showAvailableOnly;

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Найти мастера</Text>
                        <Text style={[styles.subtitle, { color: theme.text + '66' }]}>
                            {filteredMasters.length} специалистов
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.filterButton, { 
                            backgroundColor: hasActiveFilters ? theme.tint : theme.card,
                        }]}
                        onPress={() => setShowFilters(true)}
                    >
                        <Ionicons 
                            name="options-outline" 
                            size={20} 
                            color={hasActiveFilters ? 'white' : theme.tint} 
                        />
                        {hasActiveFilters && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>•</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                    <Ionicons name="search-outline" size={20} color={theme.text + '66'} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Поиск по имени, городу..."
                        placeholderTextColor={theme.text + '66'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.text + '66'} />
                        </TouchableOpacity>
                    )}
                </View>

                {hasActiveFilters && (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.activeFilters}
                    >
                        {selectedCategory && (
                            <View style={[styles.filterChip, { backgroundColor: theme.tint + '20' }]}>
                                <Text style={[styles.filterChipText, { color: theme.tint }]}>
                                    {categories.find(c => c.id === selectedCategory)?.name}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                                    <Ionicons name="close" size={16} color={theme.tint} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {selectedCity && (
                            <View style={[styles.filterChip, { backgroundColor: theme.tint + '20' }]}>
                                <Text style={[styles.filterChipText, { color: theme.tint }]}>
                                    {selectedCity}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedCity('')}>
                                    <Ionicons name="close" size={16} color={theme.tint} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {minRating > 0 && (
                            <View style={[styles.filterChip, { backgroundColor: theme.tint + '20' }]}>
                                <Text style={[styles.filterChipText, { color: theme.tint }]}>
                                    Рейтинг ≥ {minRating}
                                </Text>
                                <TouchableOpacity onPress={() => setMinRating(0)}>
                                    <Ionicons name="close" size={16} color={theme.tint} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {showAvailableOnly && (
                            <View style={[styles.filterChip, { backgroundColor: theme.tint + '20' }]}>
                                <Text style={[styles.filterChipText, { color: theme.tint }]}>
                                    Доступны
                                </Text>
                                <TouchableOpacity onPress={() => setShowAvailableOnly(false)}>
                                    <Ionicons name="close" size={16} color={theme.tint} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity 
                            style={[styles.clearFiltersBtn, { borderColor: theme.text + '20' }]}
                            onPress={clearFilters}
                        >
                            <Text style={[styles.clearFiltersText, { color: theme.text + '66' }]}>
                                Очистить все
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>

            <FlatList
                data={filteredMasters}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                    <MasterCard
                        master={item}
                        onPress={handleMasterPress}
                        onWrite={handleWrite}
                        onCreateOrder={handleCreateOrder}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={theme.text + '33'} />
                        <Text style={[styles.emptyText, { color: theme.text + '99' }]}>
                            {searchQuery || hasActiveFilters 
                                ? 'Мастера не найдены. Попробуйте изменить фильтры.'
                                : 'Мастера не найдены в вашем регионе.'}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity 
                                style={[styles.clearFiltersButton, { backgroundColor: theme.tint }]}
                                onPress={clearFilters}
                            >
                                <Text style={styles.clearFiltersButtonText}>Очистить фильтры</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            <Modal
                visible={showFilters}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Фильтры</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.filterLabel, { color: theme.text }]}>Категория</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                                <TouchableOpacity
                                    style={[
                                        styles.categoryChip,
                                        { backgroundColor: selectedCategory === null ? theme.tint : theme.card }
                                    ]}
                                    onPress={() => setSelectedCategory(null)}
                                >
                                    <Text style={[
                                        styles.categoryChipText,
                                        { color: selectedCategory === null ? 'white' : theme.text }
                                    ]}>Все</Text>
                                </TouchableOpacity>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            { backgroundColor: selectedCategory === cat.id ? theme.tint : theme.card }
                                        ]}
                                        onPress={() => setSelectedCategory(cat.id)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            { color: selectedCategory === cat.id ? 'white' : theme.text }
                                        ]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.filterLabel, { color: theme.text }]}>Город</Text>
                            <TextInput
                                style={[styles.filterInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                placeholder="Введите город"
                                placeholderTextColor={theme.text + '66'}
                                value={selectedCity}
                                onChangeText={setSelectedCity}
                            />

                            <Text style={[styles.filterLabel, { color: theme.text }]}>Минимальный рейтинг</Text>
                            <View style={styles.ratingButtons}>
                                {[0, 3, 4, 4.5].map(rating => (
                                    <TouchableOpacity
                                        key={rating}
                                        style={[
                                            styles.ratingButton,
                                            { 
                                                backgroundColor: minRating === rating ? theme.tint : theme.card,
                                                borderColor: theme.text + '20'
                                            }
                                        ]}
                                        onPress={() => setMinRating(rating)}
                                    >
                                        <Ionicons 
                                            name="star" 
                                            size={16} 
                                            color={minRating === rating ? 'white' : '#FFD700'} 
                                        />
                                        <Text style={[
                                            styles.ratingButtonText,
                                            { color: minRating === rating ? 'white' : theme.text }
                                        ]}>
                                            {rating === 0 ? 'Все' : `${rating}+`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setShowAvailableOnly(!showAvailableOnly)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    { 
                                        backgroundColor: showAvailableOnly ? theme.tint : 'transparent',
                                        borderColor: showAvailableOnly ? theme.tint : theme.text + '40'
                                    }
                                ]}>
                                    {showAvailableOnly && (
                                        <Ionicons name="checkmark" size={18} color="white" />
                                    )}
                                </View>
                                <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                                    Только доступные мастера
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.clearButton, { backgroundColor: theme.card }]}
                                onPress={clearFilters}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.text }]}>Очистить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.applyButton, { backgroundColor: theme.tint }]}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>Применить</Text>
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
        paddingBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    activeFilters: {
        marginTop: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        gap: 6,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    clearFiltersBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    clearFiltersText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    clearFiltersButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    clearFiltersButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 16,
    },
    categoriesScroll: {
        marginBottom: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterInput: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    ratingButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    ratingButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
    },
    ratingButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxLabel: {
        fontSize: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButton: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    applyButton: {},
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
