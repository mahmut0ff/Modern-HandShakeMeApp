import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reviewsApi, Review } from '@/src/api/reviews';

export default function MasterReviewsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const masterId = params.id as string;
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [lastKey, setLastKey] = useState<string | undefined>();
    const [filter, setFilter] = useState<number | undefined>();

    useEffect(() => {
        loadReviews();
    }, [filter]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewsApi.listReviews(masterId, {
                limit: 20,
                rating: filter,
            });

            setReviews(response.data.data);
            setHasMore(response.data.pagination.hasMore);
            setLastKey(response.data.pagination.lastEvaluatedKey);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || !lastKey) return;

        try {
            const response = await reviewsApi.listReviews(masterId, {
                limit: 20,
                rating: filter,
                lastEvaluatedKey: lastKey,
            });

            setReviews([...reviews, ...response.data.data]);
            setHasMore(response.data.pagination.hasMore);
            setLastKey(response.data.pagination.lastEvaluatedKey);
        } catch (error) {
            console.error('Failed to load more reviews:', error);
        }
    };

    const renderFilterButton = (rating: number | undefined, label: string) => {
        const isActive = filter === rating;
        return (
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    {
                        backgroundColor: isActive ? '#007AFF' : theme.card,
                        borderColor: isActive ? '#007AFF' : theme.text + '20',
                    }
                ]}
                onPress={() => setFilter(rating)}
            >
                <Text style={[
                    styles.filterButtonText,
                    { color: isActive ? '#FFF' : theme.text }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderReview = ({ item }: { item: Review }) => {
        const clientName = item.isAnonymous
            ? 'Анонимный клиент'
            : item.client
                ? `${item.client.firstName} ${item.client.lastName}`
                : 'Клиент';

        return (
            <View style={[styles.reviewCard, { backgroundColor: theme.card }]}>
                <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                        {!item.isAnonymous && item.client?.avatar ? (
                            <Image source={{ uri: item.client.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.text + '20' }]}>
                                <Ionicons name="person" size={20} color={theme.text + '60'} />
                            </View>
                        )}
                        <View style={styles.reviewAuthorInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.reviewAuthorName, { color: theme.text }]}>
                                    {clientName}
                                </Text>
                                {item.isVerified && (
                                    <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                                )}
                            </View>
                            <Text style={[styles.reviewDate, { color: theme.text + '60' }]}>
                                {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                                key={star}
                                name={star <= item.rating ? 'star' : 'star-outline'}
                                size={16}
                                color="#FFB800"
                            />
                        ))}
                    </View>
                </View>

                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {item.tags.map((tag, index) => (
                            <View key={index} style={[styles.tag, { backgroundColor: theme.text + '10' }]}>
                                <Text style={[styles.tagText, { color: theme.text }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={[styles.reviewComment, { color: theme.text }]}>
                    {item.comment}
                </Text>

                {item.order && (
                    <Text style={[styles.orderInfo, { color: theme.text + '60' }]}>
                        Заказ: {item.order.title}
                    </Text>
                )}

                {item.response && (
                    <View style={[styles.responseCard, { backgroundColor: theme.background }]}>
                        <Text style={[styles.responseLabel, { color: theme.text + '80' }]}>
                            Ответ мастера:
                        </Text>
                        <Text style={[styles.responseText, { color: theme.text }]}>
                            {item.response}
                        </Text>
                        <Text style={[styles.responseDate, { color: theme.text + '60' }]}>
                            {new Date(item.responseAt!).toLocaleDateString('ru-RU')}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Все отзывы</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {renderFilterButton(undefined, 'Все')}
                {renderFilterButton(5, '5 ⭐')}
                {renderFilterButton(4, '4 ⭐')}
                {renderFilterButton(3, '3 ⭐')}
                {renderFilterButton(2, '2 ⭐')}
                {renderFilterButton(1, '1 ⭐')}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={64} color={theme.text + '40'} />
                    <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                        Нет отзывов
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
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
    filtersContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    reviewCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reviewAuthor: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAuthorInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reviewAuthorName: {
        fontSize: 16,
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: 12,
        marginTop: 2,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    reviewComment: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    orderInfo: {
        fontSize: 13,
        marginTop: 8,
    },
    responseCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    responseLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    responseText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    responseDate: {
        fontSize: 12,
    },
});
