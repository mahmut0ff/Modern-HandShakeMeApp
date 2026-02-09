import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { applicationsApi, Application } from '@/src/api/applications';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, Card } from '@/components/ui';

export default function ResponsesScreen() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchApplications = useCallback(async () => {
        try {
            const response = await applicationsApi.getMyApplications();
            setApplications(response.data.results);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const handleAccept = async (appId: string) => {
        Alert.alert('Accept Application', 'Are you sure you want to accept this master?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Accept',
                onPress: async () => {
                    try {
                        const application = applications.find(a => a.id === appId);
                        if (!application) return;
                        await applicationsApi.respondToApplication(application.order_id, appId, 'ACCEPT');
                        Alert.alert('Success', 'Application accepted!');
                        fetchApplications();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to accept application');
                    }
                }
            }
        ]);
    };

    const handleReject = async (appId: string) => {
        Alert.alert('Reject Application', 'Are you sure you want to reject this application?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const application = applications.find(a => a.id === appId);
                        if (!application) return;
                        await applicationsApi.respondToApplication(application.order_id, appId, 'REJECT');
                        Alert.alert('Success', 'Application rejected');
                        fetchApplications();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to reject application');
                    }
                }
            }
        ]);
    };

    const renderApplicationItem = ({ item }: { item: Application }) => (
        <TouchableOpacity
            style={[styles.appCard, { backgroundColor: theme.card }]}
            onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.order_id } })}
        >
            <View style={styles.appHeader}>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'ACCEPTED' ? '#34C75920' :
                        item.status === 'REJECTED' ? '#FF3B3020' : '#FF950020'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'ACCEPTED' ? '#34C759' :
                            item.status === 'REJECTED' ? '#FF3B30' : '#FF9500'
                    }]}>{item.status}</Text>
                </View>
                {(item as any).orderStatus && item.status === 'ACCEPTED' && (
                    <View style={[styles.statusBadge, { backgroundColor: '#007AFF10', marginLeft: 8 }]}>
                        <Text style={[styles.statusText, { color: '#007AFF' }]}>{(item as any).orderStatus}</Text>
                    </View>
                )}
                <Text style={[styles.appDate, { color: theme.text + '66' }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <Text style={[styles.appCover, { color: theme.text }]} numberOfLines={3}>
                {item.cover_letter}
            </Text>

            <View style={styles.appFooter}>
                <TouchableOpacity 
                    style={styles.masterInfo}
                    onPress={() => {
                        if (user?.role === 'CLIENT' && item.master_id) {
                            router.push(`/masters/${item.master_id}` as any);
                        }
                    }}
                    disabled={user?.role !== 'CLIENT'}
                    activeOpacity={user?.role === 'CLIENT' ? 0.7 : 1}
                >
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                        <Ionicons name="person" size={14} color={theme.tint} />
                    </View>
                    <Text style={[styles.masterName, { color: theme.text + '99' }]}>
                        {user?.role === 'CLIENT' ? (item.master?.name || 'Master') : 'My Application'}
                    </Text>
                    {user?.role === 'CLIENT' && (
                        <Ionicons name="chevron-forward" size={16} color={theme.text + '66'} style={{ marginLeft: 4 }} />
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={[styles.priceText, { color: theme.tint }]}>${item.proposed_price}</Text>
                </View>
                {user?.role === 'CLIENT' && item.status === 'PENDING' && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.text + '10', marginRight: 8 }]}
                            onPress={() => handleReject(item.id)}
                        >
                            <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handleAccept(item.id)}
                        >
                            <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                    {user?.role === 'CLIENT' ? 'Incoming Responses' : 'My Applications'}
                </Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <FlatList
                    data={applications}
                    renderItem={renderApplicationItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="mail-outline" size={60} color={theme.text + '33'} />
                            <Text style={[styles.emptyText, { color: theme.text + '66' }]}>No responses yet.</Text>
                        </View>
                    }
                />
            )}
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
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    appCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    appDate: {
        fontSize: 12,
    },
    appCover: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 15,
    },
    appFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    masterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    masterName: {
        fontSize: 14,
    },
    actionBtn: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 20,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
