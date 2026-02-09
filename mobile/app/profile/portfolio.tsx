import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { portfolioApi, PortfolioItem } from '@/src/api/portfolio';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function PortfolioScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        try {
            const response = await portfolioApi.listPortfolio({
                masterId: user?.id,
                includePrivate: true,
                sortBy: 'recent',
            });
            setPortfolioItems(response.data.results);
        } catch (error) {
            console.error('Failed to load portfolio', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPortfolio();
    };

    const handleAddItem = () => {
        router.push('/profile/portfolio/add' as any);
    };

    const handleEditItem = (item: PortfolioItem) => {
        router.push({
            pathname: '/profile/portfolio/add',
            params: { itemId: item.id }
        } as any);
    };

    const handleDeleteItem = (item: PortfolioItem) => {
        Alert.alert(
            'Delete Portfolio Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await portfolioApi.deletePortfolioItem(item.id);
                            setPortfolioItems(prev => prev.filter(i => i.id !== item.id));
                            Alert.alert('Success', 'Portfolio item deleted');
                        } catch (error) {
                            console.error('Failed to delete item', error);
                            Alert.alert('Error', 'Failed to delete portfolio item');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: PortfolioItem }) => (
        <TouchableOpacity
            style={[styles.portfolioCard, { backgroundColor: theme.card }]}
            activeOpacity={0.7}
            onPress={() => handleEditItem(item)}
        >
            <Image
                source={{ uri: item.images[0] }}
                style={styles.portfolioImage}
                contentFit="cover"
            />
            
            {!item.isPublic && (
                <View style={[styles.privateBadge, { backgroundColor: theme.text + '90' }]}>
                    <Ionicons name="eye-off" size={12} color="white" />
                    <Text style={styles.privateBadgeText}>Private</Text>
                </View>
            )}

            <View style={styles.portfolioInfo}>
                <Text style={[styles.portfolioTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                
                {item.cost && (
                    <Text style={[styles.portfolioCost, { color: theme.tint }]}>
                        ${item.cost}
                    </Text>
                )}

                <View style={styles.portfolioFooter}>
                    <View style={styles.portfolioStats}>
                        <Ionicons name="eye-outline" size={14} color={theme.text + '66'} />
                        <Text style={[styles.portfolioStatsText, { color: theme.text + '66' }]}>
                            {item.viewsCount}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item);
                        }}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={theme.text + '40'} />
            <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                No portfolio items yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + '40' }]}>
                Showcase your work to attract more clients
            </Text>
            <TouchableOpacity
                style={[styles.addPortfolioButton, { backgroundColor: theme.tint }]}
                onPress={handleAddItem}
            >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addPortfolioText}>Add Portfolio Item</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10', paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Portfolio</Text>
                    <View style={styles.addButton} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10', paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Portfolio</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                    <Ionicons name="add" size={24} color={theme.tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={portfolioItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.tint}
                    />
                }
                showsVerticalScrollIndicator={false}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    listContent: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    portfolioCard: {
        width: ITEM_WIDTH,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    portfolioImage: {
        width: '100%',
        height: ITEM_WIDTH,
    },
    privateBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    privateBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    portfolioInfo: {
        padding: 12,
    },
    portfolioTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    portfolioCost: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    portfolioFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    portfolioStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    portfolioStatsText: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 24,
    },
    addPortfolioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    addPortfolioText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
