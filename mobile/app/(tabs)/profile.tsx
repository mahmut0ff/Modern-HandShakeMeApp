import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi, ProfileStats } from '@/src/api/profile';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, Card, Button } from '@/components/ui';
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
    const [masterProfile, setMasterProfile] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, [user?.role]);

    const fetchStats = async () => {
        try {
            // Fetch master profile if user is a master
            if (user?.role === 'MASTER') {
                try {
                    const profileResponse = await profileApi.getMasterProfile();
                    setMasterProfile(profileResponse.data);
                } catch (error) {
                    console.log('Could not fetch master profile');
                }
            }
            
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
            icon: 'notifications-outline' as const,
            title: 'Notifications',
            subtitle: 'Manage notification settings',
            onPress: () => router.push('/profile/notification-settings' as any),
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
            showsVerticalScrollIndicator={false}
        >
            {/* Header with Avatar */}
            <View style={[styles.profileHeader, { backgroundColor: theme.tint }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.roleLabel}>
                        {user?.role === 'MASTER' ? '🔧 Master' : '👤 Client'}
                    </Text>
                    <View style={styles.userNameRow}>
                        <Text style={styles.userName}>
                            {user?.firstName} {user?.lastName}
                        </Text>
                        {user?.role === 'MASTER' && masterProfile?.isVerified && (
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        )}
                    </View>
                    {user?.city && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.locationText}>{user.city}</Text>
                        </View>
                    )}
                </View>
                
                {/* Avatar positioned to overlap */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => router.push('/profile/edit' as any)}
                    >
                        {user?.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.card }]}>
                                <Ionicons name="person" size={40} color={theme.tint} />
                            </View>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.tint }]}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Stats */}
            {stats && (
                <View style={styles.statsContainer}>
                    <StatCard
                        icon="checkmark-circle-outline"
                        label="Completed"
                        value={stats.completedOrders || 0}
                        variant="compact"
                    />
                    <StatCard
                        icon="star-outline"
                        label="Rating"
                        value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                        variant="compact"
                    />
                    <StatCard
                        icon="time-outline"
                        label="Response"
                        value={stats.responseTime || 'N/A'}
                        variant="compact"
                    />
                </View>
            )}

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <Card>
                    {menuItems.map((item, index) => (
                        <MenuListItem
                            key={index}
                            icon={item.icon}
                            title={item.title}
                            subtitle={item.subtitle}
                            onPress={item.onPress}
                        />
                    ))}
                </Card>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
                <Button
                    title="Sign Out"
                    variant="outline"
                    onPress={signOut}
                    icon={<Ionicons name="log-out-outline" size={20} color="#ff3b30" />}
                    textStyle={{ color: '#ff3b30' }}
                    style={{ borderColor: '#ff3b30' }}
                />
            </View>

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
    profileHeader: {
        paddingTop: 60,
        paddingBottom: 70,
        paddingHorizontal: 20,
    },
    headerContent: {
        alignItems: 'center',
    },
    roleLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        marginBottom: 4,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    avatarSection: {
        position: 'absolute',
        bottom: -50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
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
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        gap: 8,
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    logoutContainer: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
});
