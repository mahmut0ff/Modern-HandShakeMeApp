import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { applicationsApi, Application } from '@/src/api/applications';
import { ordersApi, Order } from '@/src/api/orders';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function JobApplicationsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [order, setOrder] = useState<Order | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'FAVORITES' | 'NEW'>('ALL');
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const [orderRes, appsRes] = await Promise.all([
                ordersApi.getOrder(id),
                applicationsApi.getOrderApplications(id)
            ]);
            setOrder(orderRes.data);
            setApplications(appsRes.data.results);

            // Mark unviewed applications as viewed
            const unviewed = appsRes.data.results.filter(app => !app.viewed_at && app.status === 'PENDING');
            if (unviewed.length > 0) {
                unviewed.forEach(app => applicationsApi.markViewed(app.id, id));
            }
        } catch (error) {
            console.error('Failed to fetch applications', error);
            Alert.alert('Error', 'Failed to load applications');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAccept = async (appId: string) => {
        Alert.alert('Accept Application', 'Are you sure you want to accept this specialist?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Accept',
                onPress: async () => {
                    try {
                        await applicationsApi.respondToApplication(id!, appId, 'ACCEPT');
                        Alert.alert('Success', 'Application accepted!');
                        fetchData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to accept application');
                    }
                }
            }
        ]);
    };

    const handleRejectClick = (appId: string) => {
        setSelectedAppId(appId);
        setIsRejectModalVisible(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedAppId) return;
        try {
            await applicationsApi.respondToApplication(id!, selectedAppId, 'REJECT', rejectionReason);
            setIsRejectModalVisible(false);
            setRejectionReason('');
            setSelectedAppId(null);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject application');
        }
    };

    const handleToggleLike = async (appId: string) => {
        try {
            await applicationsApi.respondToApplication(id!, appId, 'LIKE');
            fetchData();
        } catch (error) {
            console.error('Failed to toggle like', error);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (activeFilter === 'FAVORITES') return app.is_favorite;
        if (activeFilter === 'NEW') return !app.viewed_at;
        return true;
    });

    const renderApplicationItem = ({ item }: { item: Application }) => (
        <View style={[styles.appCard, { backgroundColor: theme.card }]}>
            <View style={styles.appHeader}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name="person" size={24} color={theme.tint} />
                </View>
                <View style={styles.masterInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.masterName, { color: theme.text }]}>
                            {item.master?.name || 'Specialist'}
                        </Text>
                        <TouchableOpacity onPress={() => handleToggleLike(item.id)}>
                            <Ionicons
                                name={item.is_favorite ? "heart" : "heart-outline"}
                                size={22}
                                color={item.is_favorite ? "#FF3B30" : theme.text + '33'}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.appDate, { color: theme.text + '66' }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                        {!item.viewed_at && <Text style={{ color: theme.tint, fontWeight: 'bold' }}> • NEW</Text>}
                    </Text>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'ACCEPTED' ? '#34C75920' :
                        item.status === 'REJECTED' ? '#FF3B3020' : theme.tint + '10'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'ACCEPTED' ? '#34C759' :
                            item.status === 'REJECTED' ? '#FF3B30' : theme.tint
                    }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: theme.text + '66' }]}>Proposed Price</Text>
                    <Text style={[styles.detailValue, { color: theme.tint }]}>${item.proposed_price}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: theme.text + '66' }]}>Duration</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.proposed_duration_days} days</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cover Letter</Text>
            <Text style={[styles.appCover, { color: theme.text + '99' }]}>
                {item.cover_letter}
            </Text>

            {item.status === 'PENDING' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.text + '10' }]}
                        onPress={() => handleRejectClick(item.id)}
                    >
                        <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary, marginLeft: 12 }]}
                        onPress={() => handleAccept(item.id)}
                    >
                        <Ionicons name="checkmark" size={18} color={theme.onPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const FilterTabs = () => (
        <View style={styles.filterContainer}>
            {[
                { id: 'ALL', label: 'All' },
                { id: 'FAVORITES', label: 'Favorites' },
                { id: 'NEW', label: 'New' }
            ].map(tab => (
                <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveFilter(tab.id as any)}
                    style={[
                        styles.filterTab,
                        activeFilter === tab.id && { backgroundColor: theme.tint + '15', borderColor: theme.tint }
                    ]}
                >
                    <Text style={[
                        styles.filterTabText,
                        { color: activeFilter === tab.id ? theme.tint : theme.text + '66' }
                    ]}>{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Responses</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text + '66' }]} numberOfLines={1}>
                        {order?.title || 'Loading...'}
                    </Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <FilterTabs />

            {isLoading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <FlatList
                    data={filteredApplications}
                    renderItem={renderApplicationItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="mail-outline" size={60} color={theme.text + '33'} />
                            <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                                {activeFilter === 'ALL' ? 'No responses yet.' :
                                    activeFilter === 'FAVORITES' ? 'No favorite responses.' :
                                        'No new responses.'}
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={isRejectModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Application</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.text + '66' }]}>
                            Optional: Provide a reason for rejection to help the specialist improve.
                        </Text>
                        <TextInput
                            style={[styles.reasonInput, { color: theme.text, borderColor: theme.text + '10', backgroundColor: theme.text + '05' }]}
                            placeholder="Reason for rejection..."
                            placeholderTextColor={theme.text + '33'}
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.text + '10' }]}
                                onPress={() => setIsRejectModalVisible(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]}
                                onPress={handleConfirmReject}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirm Reject</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    appCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    masterInfo: {
        flex: 1,
    },
    masterName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appDate: {
        fontSize: 12,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    appCover: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 20,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        alignItems: 'center',
        fontSize: 16,
        marginTop: 20,
    },
});
