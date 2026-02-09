import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { mastersApi, MasterProfile } from '@/src/api/masters';
import { chatApi } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { Button, Card } from '@/components/ui';

const { width } = Dimensions.get('window');

export default function MasterProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [profile, setProfile] = useState<MasterProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!id) return;
        try {
            const response = await mastersApi.getMasterProfile(id);
            setProfile(response.data);
        } catch (error) {
            console.error('Failed to fetch master profile', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleWrite = async () => {
        if (!profile || !user) return;

        try {
            const response = await chatApi.createRoom({
                participants: [user.id, profile.userId],
            });

            router.push(`/chat/${response.data.id}` as any);
        } catch (error) {
            console.error('Failed to create chat room', error);
            Alert.alert('Error', 'Failed to start chat. Please try again.');
        }
    };

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Profile not found</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Image
                    source={profile.user?.avatar || 'https://via.placeholder.com/150'}
                    style={styles.avatar}
                />
                <View style={styles.headerOverlay} />
            </View>

            <View style={[styles.content, { backgroundColor: theme.background }]}>
                <View style={styles.profileInfo}>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, { color: theme.text }]}>
                            {profile.firstName} {profile.lastName}
                        </Text>
                        {profile.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.specialization, { color: theme.text + '99' }]}>
                        Master Specialist
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{profile.rating}</Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{profile.completedOrders}</Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Jobs</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{profile.reviewsCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Reviews</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                    <Text style={[styles.bio, { color: theme.text + 'CC' }]}>
                        {profile.bio || 'No description provided.'}
                    </Text>
                </View>

                {profile.portfolio && profile.portfolio.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Portfolio</Text>
                        <View style={styles.portfolioGrid}>
                            {profile.portfolio.map((item) => (
                                <View
                                    key={item.id}
                                    style={styles.portfolioItem}
                                >
                                    <Image
                                        source={item.images[0] || 'https://via.placeholder.com/300'}
                                        style={styles.portfolioImage}
                                        contentFit="cover"
                                    />
                                    <View style={styles.portfolioOverlay}>
                                        <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
                                        {item.cost && (
                                            <Text style={styles.portfolioCost}>${item.cost}</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {profile.reviews && profile.reviews.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Reviews</Text>
                        {profile.reviews.map((review) => (
                            <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.text + '1A' }]}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons
                                                key={s}
                                                name={s <= review.rating ? "star" : "star-outline"}
                                                size={16}
                                                color="#FFD700"
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.reviewDate, { color: theme.text + '66' }]}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[styles.reviewText, { color: theme.text + 'CC' }]}>{review.comment}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={[styles.actionBar, { backgroundColor: theme.card, borderTopColor: theme.text + '1A' }]}>
                <TouchableOpacity
                    style={[styles.chatButton, { backgroundColor: theme.background }]}
                    onPress={handleWrite}
                >
                    <Ionicons name="chatbubble-outline" size={24} color={theme.tint} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.orderButton, { backgroundColor: theme.tint }]}
                    onPress={() => router.push({
                        pathname: '/create-job',
                        params: { masterId: profile.userId }
                    })}
                >
                    <Text style={styles.orderButtonText}>Direct Order</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
        height: 300,
        width: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    content: {
        flex: 1,
        marginTop: -30,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 100,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    verifiedBadge: {
        marginTop: 4,
    },
    specialization: {
        fontSize: 16,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 24,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    bio: {
        fontSize: 15,
        lineHeight: 24,
    },
    portfolioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    portfolioItem: {
        width: (width - 52) / 2,
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    portfolioImage: {
        width: '100%',
        height: '100%',
    },
    portfolioOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    portfolioTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    portfolioCost: {
        color: 'white',
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
    reviewItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
    },
    reviewDate: {
        fontSize: 12,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        gap: 16,
    },
    chatButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
