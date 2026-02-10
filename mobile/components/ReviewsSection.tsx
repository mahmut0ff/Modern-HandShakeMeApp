import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reviewsApi, ReviewStats } from '@/src/api/reviews';

interface ReviewsSectionProps {
    masterId: string;
    compact?: boolean;
}

export function ReviewsSection({ masterId, compact = false }: ReviewsSectionProps) {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [masterId]);

    const loadStats = async () => {
        try {
            const response = await reviewsApi.getReviewStats(masterId);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load review stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }

    if (!stats || stats.totalReviews === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="star-outline" size={32} color={theme.text + '40'} />
                <Text style={[styles.emptyText, { color: theme.text + '60' }]}>
                    Пока нет отзывов
                </Text>
            </View>
        );
    }

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactContainer, { backgroundColor: theme.card }]}
                onPress={() => router.push(`/masters/${masterId}/reviews` as any)}
            >
                <View style={styles.compactRating}>
                    <Ionicons name="star" size={20} color="#FFB800" />
                    <Text style={[styles.compactRatingText, { color: theme.text }]}>
                        {stats.averageRating.toFixed(1)}
                    </Text>
                    <Text style={[styles.compactCount, { color: theme.text + '80' }]}>
                        ({stats.totalReviews})
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Отзывы</Text>
                <TouchableOpacity onPress={() => router.push(`/masters/${masterId}/reviews` as any)}>
                    <Text style={styles.viewAllText}>Все отзывы</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.ratingBox}>
                    <Text style={[styles.ratingValue, { color: theme.text }]}>
                        {stats.averageRating.toFixed(1)}
                    </Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                                key={star}
                                name={star <= Math.round(stats.averageRating) ? 'star' : 'star-outline'}
                                size={16}
                                color="#FFB800"
                            />
                        ))}
                    </View>
                    <Text style={[styles.totalText, { color: theme.text + '80' }]}>
                        {stats.totalReviews} отзывов
                    </Text>
                </View>

                <View style={styles.distributionBox}>
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] || 0;
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                        return (
                            <View key={rating} style={styles.distributionRow}>
                                <Text style={[styles.distributionLabel, { color: theme.text }]}>
                                    {rating}
                                </Text>
                                <View style={[styles.distributionBar, { backgroundColor: theme.text + '10' }]}>
                                    <View
                                        style={[
                                            styles.distributionFill,
                                            { width: `${percentage}%`, backgroundColor: '#FFB800' }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.distributionCount, { color: theme.text + '80' }]}>
                                    {count}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {stats.recentReviews && stats.recentReviews.length > 0 && (
                <View style={styles.recentReviews}>
                    {stats.recentReviews.slice(0, 3).map((review) => (
                        <View key={review.id} style={[styles.reviewCard, { borderBottomColor: theme.text + '10' }]}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewAuthor}>
                                    {review.clientAvatar ? (
                                        <Image source={{ uri: review.clientAvatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.text + '20' }]}>
                                            <Ionicons name="person" size={16} color={theme.text + '60'} />
                                        </View>
                                    )}
                                    <View>
                                        <Text style={[styles.authorName, { color: theme.text }]}>
                                            {review.clientName}
                                        </Text>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Ionicons
                                                    key={star}
                                                    name={star <= review.rating ? 'star' : 'star-outline'}
                                                    size={12}
                                                    color="#FFB800"
                                                />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <Text style={[styles.reviewDate, { color: theme.text + '60' }]}>
                                    {new Date(review.createdAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                            <Text
                                style={[styles.reviewComment, { color: theme.text + '80' }]}
                                numberOfLines={2}
                            >
                                {review.comment}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
    },
    compactRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactRatingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    compactCount: {
        fontSize: 14,
    },
    container: {
        borderRadius: 12,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    viewAllText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    ratingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    ratingValue: {
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,
    },
    totalText: {
        fontSize: 12,
    },
    distributionBox: {
        flex: 1,
        gap: 4,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    distributionLabel: {
        fontSize: 12,
        width: 12,
    },
    distributionBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    distributionFill: {
        height: '100%',
        borderRadius: 3,
    },
    distributionCount: {
        fontSize: 12,
        width: 24,
        textAlign: 'right',
    },
    recentReviews: {
        gap: 12,
    },
    reviewCard: {
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewAuthor: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: 12,
    },
    reviewComment: {
        fontSize: 13,
        lineHeight: 18,
    },
});
