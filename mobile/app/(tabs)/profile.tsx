import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi, ProfileStats } from '@/src/api/profile';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MenuListItem from '@/components/MenuListItem';
import StatCard from '@/components/StatCard';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [user?.role]);

    const fetchStats = async () => {
        try {
            const response = user?.role === 'MASTER'
                ? await profileApi.getMasterStats()
                : await profileApi.getClientStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const menuItems = [
        {
            icon: 'person-outline' as const,
            title: 'My Profile',
            subtitle: 'Edit your personal information',
            onPress: () => router.push('/profile/edit' as any),
        },
        ...(user?.role === 'MASTER' ? [{
            icon: 'briefcase-outline' as const,
            title: 'Portfolio',
            subtitle: 'Manage your work showcase',
            onPress: () => router.push('/profile/portfolio' as any),
        }] : []),
        {
            icon: 'document-text-outline' as const,
            title: 'My Orders',
            subtitle: user?.role === 'MASTER' ? 'View accepted jobs' : 'View your posted jobs',
            onPress: () => router.push('/my-jobs' as any),
        },
        ...(user?.role === 'MASTER' ? [{
            icon: 'paper-plane-outline' as const,
            title: 'Responses',
            subtitle: 'Your job applications',
            onPress: () => router.push('/responses' as any),
        }] : []),
        {
            icon: 'chatbubbles-outline' as const,
            title: 'Chats',
            subtitle: 'Your conversations',
            onPress: () => router.push('/chat' as any),
        },
        {
            icon: 'heart-outline' as const,
            title: 'Favorites',
            subtitle: 'Saved items',
            onPress: () => router.push('/profile/favorites' as any),
        },
        {
            icon: 'star-outline' as const,
            title: 'Reviews',
            subtitle: 'Reviews about you',
            onPress: () => router.push('/profile/reviews' as any),
        },
        {
            icon: 'settings-outline' as const,
            title: 'Settings',
            subtitle: 'Preferences and privacy',
            onPress: () => router.push('/profile/settings' as any),
        },
    ];

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            }
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => router.push('/profile/edit' as any)}
                >
                    <Image
                        source={user?.avatar || 'https://via.placeholder.com/100'}
                        style={styles.avatar}
                    />
                    <View style={[styles.editBadge, { backgroundColor: theme.tint }]}>
                        <Ionicons name="camera" size={16} color="white" />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.name, { color: theme.text }]}>
                    {user?.firstName} {user?.lastName}
                </Text>

                <View style={[styles.roleBadge, { backgroundColor: theme.tint + '15' }]}>
                    <Text style={[styles.roleText, { color: theme.tint }]}>
                        {user?.role === 'MASTER' ? '🔧 Master' : '👤 Client'}
                    </Text>
                </View>

                {user?.city && (
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={theme.text + '66'} />
                        <Text style={[styles.location, { color: theme.text + '66' }]}>{user.city}</Text>
                    </View>
                )}
            </View>

            {/* Quick Stats */}
            {stats && (
                <View style={styles.statsContainer}>
                    <StatCard
                        icon="checkmark-circle-outline"
                        label="Completed"
                        value={stats.completedOrders || 0}
                    />
                    <StatCard
                        icon="star-outline"
                        label="Rating"
                        value={stats.averageRating?.toFixed(1) || 'N/A'}
                    />
                    <StatCard
                        icon="time-outline"
                        label="Response"
                        value={stats.responseTime || 'N/A'}
                    />
                </View>
            )}

            {/* Menu Items */}
            <View style={[styles.menuSection, { backgroundColor: theme.card }]}>
                {menuItems.map((item, index) => (
                    <MenuListItem
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        onPress={item.onPress}
                    />
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { borderColor: '#ff3b30' }]}
                onPress={signOut}
            >
                <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
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
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
    },
    menuSection: {
        marginTop: 8,
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 24,
        gap: 8,
    },
    logoutText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
    },
});
