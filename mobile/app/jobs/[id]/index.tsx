import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ordersApi, Order } from '@/src/api/orders';
import { applicationsApi, Application } from '@/src/api/applications';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, Card, Button } from '@/components/ui';
import { formatDate } from '@/src/utils/date';

export default function JobDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [order, setOrder] = useState<Order | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const orderRes = await ordersApi.getOrder(id);
            setOrder(orderRes.data);

            if (user?.id === orderRes.data.clientId) {
                const appsRes = await applicationsApi.getOrderApplications(id);
                setApplications(appsRes.data.results);
            } else if (user?.role === 'MASTER') {
                // Masters only see their own application for this order
                const appsRes = await applicationsApi.getMyApplications();
                const myApp = appsRes.data.results.filter(app => app.order_id === id);
                setApplications(myApp);
            }
        } catch (error) {
            console.error('Failed to fetch job details', error);
            // Don't alert if it's just a 404 for application
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id, user?.id, user?.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Job',
            'Are you sure you want to delete this job?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await ordersApi.deleteOrder(id);
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete job');
                        }
                    }
                }
            ]
        );
    };

    const handleApply = () => {
        if (!order) return;
        router.push({
            pathname: '/apply-job',
            params: {
                id,
                title: order.title,
                budget: order.budgetType === 'NEGOTIABLE' ? 'Negotiable' : `$${order.budgetMin}`
            }
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Job not found</Text>
            </View>
        );
    }

    const isOwner = user?.id === order.clientId;
    const isMaster = user?.role === 'MASTER';
    const myApplication = (applications || []).find(app => (app.master_id || (app as any).masterId) === user?.id);
    const hasApplied = !!myApplication;

    const handleWithdraw = () => {
        if (!myApplication) return;
        Alert.alert(
            'Withdraw Application',
            'Are you sure you want to withdraw your application?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await applicationsApi.deleteApplication(myApplication.id, order.id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to withdraw application');
                        }
                    }
                }
            ]
        );
    };

    const handleAction = async (action: 'PAUSE' | 'RESUME' | 'ARCHIVE') => {
        try {
            await ordersApi.manageOrder(id, action);
            fetchData();
            Alert.alert('Success', `Job ${action.toLowerCase()}d successfully`);
        } catch (error) {
            Alert.alert('Error', `Failed to ${action.toLowerCase()} job`);
        }
    };

    const handleCompleteWork = async () => {
        try {
            await ordersApi.completeWork(id);
            fetchData();
            Alert.alert('Success', 'Work marked as completed. Waiting for client confirmation.');
        } catch (error) {
            Alert.alert('Error', 'Failed to mark work as completed');
        }
    };

    const handleConfirmCompletion = () => {
        router.push({
            pathname: `/jobs/${id}/review`,
            params: { masterId: order.masterId, title: order.title }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header
                title="Job Details"
                showBack
                onBackPress={() => router.back()}
                rightAction={
                    isOwner ? (
                        <TouchableOpacity onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                    ) : null
                }
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
            >
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: theme.text }]}>{order.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: theme.tint + '20' }]}>
                            <Text style={[styles.statusText, { color: theme.tint }]}>{order.status}</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={16} color={theme.text + '66'} />
                            <Text style={[styles.metaText, { color: theme.text + '66' }]}>{order.city}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.text + '66'} />
                            <Text style={[styles.metaText, { color: theme.text + '66' }]}>
                                {formatDate(order.createdAt)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
                    <Text style={[styles.description, { color: theme.text + '99' }]}>{order.description}</Text>

                    {order.images && order.images.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Photos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {order.images.map((img, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri: img }}
                                        style={styles.detailImage}
                                        contentFit="cover"
                                        transition={500}
                                    />
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <View style={styles.detailsGrid}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>Job Details</Text>
                        <View style={styles.detailRow}>
                            <View style={[styles.detailItem, { backgroundColor: theme.text + '05' }]}>
                                <Ionicons name="cube-outline" size={20} color={theme.tint} />
                                <View style={styles.detailTextContainer}>
                                    <Text style={[styles.detailLabel, { color: theme.text + '66' }]}>Work Volume</Text>
                                    <Text style={[styles.detailValue, { color: theme.text }]}>{order.workVolume || 'Not specified'}</Text>
                                </View>
                            </View>
                            <View style={[styles.detailItem, { backgroundColor: theme.text + '05' }]}>
                                <Ionicons name="ribbon-outline" size={20} color={theme.tint} />
                                <View style={styles.detailTextContainer}>
                                    <Text style={[styles.detailLabel, { color: theme.text + '66' }]}>Experience</Text>
                                    <Text style={[styles.detailValue, { color: theme.text }]}>{order.requiredExperience || 'Any'}</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20, marginBottom: 15 }]}>Site Conditions</Text>
                        <View style={styles.conditionsGrid}>
                            {[
                                { key: 'floor', label: `Floor: ${order.floor || 0}`, icon: 'layers-outline' },
                                { key: 'hasElevator', label: 'Elevator', icon: 'business-outline', value: order.hasElevator },
                                { key: 'hasElectricity', label: 'Electricity', icon: 'flash-outline', value: order.hasElectricity },
                                { key: 'hasWater', label: 'Water', icon: 'water-outline', value: order.hasWater },
                                { key: 'canStoreTools', label: 'Storage', icon: 'construct-outline', value: order.canStoreTools },
                                { key: 'hasParking', label: 'Parking', icon: 'car-outline', value: order.hasParking },
                            ].map(cond => (
                                <View key={cond.key} style={[styles.conditionChip, { backgroundColor: cond.value === false ? theme.text + '05' : theme.tint + '10' }]}>
                                    <Ionicons name={cond.icon as any} size={16} color={cond.value === false ? theme.text + '40' : theme.tint} />
                                    <Text style={[styles.conditionLabel, { color: cond.value === false ? theme.text + '40' : theme.text }]}>{cond.label}</Text>
                                    {cond.value !== undefined && cond.key !== 'floor' && (
                                        <Ionicons name={cond.value ? "checkmark-circle" : "close-circle"} size={14} color={cond.value ? "#34C759" : "#FF3B30"} style={{ marginLeft: 4 }} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{order.viewsCount || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Views</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{order.applicationsCount || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Applications</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: theme.tint }]}>
                                {order.budgetType === 'NEGOTIABLE' ? 'Neg.' : `$${order.budgetMin}`}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.text + '66' }]}>Budget</Text>
                        </View>
                    </View>
                </View>

                {isOwner && (
                    <TouchableOpacity
                        style={[styles.appsLink, { backgroundColor: theme.card }]}
                        onPress={() => router.push({ pathname: '/jobs/[id]/applications', params: { id } })}
                    >
                        <View style={[styles.appsBadge, { backgroundColor: theme.tint + '10' }]}>
                            <Ionicons name="mail-outline" size={24} color={theme.tint} />
                        </View>
                        <View style={styles.appsLinkContent}>
                            <Text style={[styles.appsLinkTitle, { color: theme.text }]}>View Applications</Text>
                            <Text style={[styles.appsLinkSubtitle, { color: theme.text + '66' }]}>
                                {order.applicationsCount || 0} specialists responded
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.text + '33'} />
                    </TouchableOpacity>
                )}

                {!isOwner && hasApplied && myApplication && (
                    <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
                        <View style={styles.statusCardHeader}>
                            <Text style={[styles.statusCardTitle, { color: theme.text }]}>Your Application</Text>
                            <View style={[
                                styles.appStatusBadge,
                                { backgroundColor: myApplication.status === 'ACCEPTED' ? '#34C75920' : myApplication.status === 'REJECTED' ? '#FF3B3020' : theme.tint + '20' }
                            ]}>
                                <Text style={[
                                    styles.appStatusText,
                                    { color: myApplication.status === 'ACCEPTED' ? '#34C759' : myApplication.status === 'REJECTED' ? '#FF3B30' : theme.tint }
                                ]}>{myApplication.status}</Text>
                            </View>
                        </View>

                        {myApplication.status === 'REJECTED' && myApplication.rejection_reason && (
                            <View style={styles.rejectionBox}>
                                <Text style={[styles.rejectionLabel, { color: '#FF3B30' }]}>Reason for rejection:</Text>
                                <Text style={[styles.rejectionText, { color: theme.text }]}>{myApplication.rejection_reason}</Text>
                            </View>
                        )}

                        <View style={styles.appDetails}>
                            <View style={styles.appDetailItem}>
                                <Text style={[styles.appDetailLabel, { color: theme.text + '66' }]}>Proposed Price</Text>
                                <Text style={[styles.appDetailValue, { color: theme.text }]}>${myApplication.proposed_price}</Text>
                            </View>
                            <View style={styles.appDetailItem}>
                                <Text style={[styles.appDetailLabel, { color: theme.text + '66' }]}>Duration</Text>
                                <Text style={[styles.appDetailValue, { color: theme.text }]}>{myApplication.proposed_duration_days} days</Text>
                            </View>
                        </View>

                        {myApplication.status === 'PENDING' && (
                            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                                <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {!isOwner && isMaster && (
                <View style={[styles.footer, { borderTopColor: theme.text + '10' }]}>
                    {order.status === 'ACTIVE' && (
                        <TouchableOpacity
                            style={[
                                styles.applyBtn,
                                { backgroundColor: hasApplied ? theme.text + '10' : theme.primary },
                                hasApplied && { opacity: 0.8 }
                            ]}
                            onPress={handleApply}
                            disabled={hasApplied || isApplying}
                        >
                            {isApplying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name={hasApplied ? "checkmark-circle" : "send"} size={20} color={hasApplied ? theme.text + '66' : theme.onPrimary} />
                                    <Text style={[styles.applyBtnText, { color: hasApplied ? theme.text + '66' : theme.onPrimary }]}>
                                        {hasApplied ? 'Applied' : 'Apply for Job'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {order.status === 'IN_PROGRESS' && order.masterId === user?.id && (
                        <>
                            <TouchableOpacity
                                style={[styles.applyBtn, { backgroundColor: theme.tint, marginBottom: 12 }]}
                                onPress={() => {
                                    // Navigate to chat with client
                                    router.push(`/chat/${order.chatRoomId || order.clientId}` as any);
                                }}
                            >
                                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                                <Text style={[styles.applyBtnText, { color: '#fff' }]}>Написать клиенту</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.applyBtn, { backgroundColor: '#34C759' }]}
                                onPress={handleCompleteWork}
                            >
                                <Ionicons name="checkmark-done" size={20} color="#fff" />
                                <Text style={[styles.applyBtnText, { color: '#fff' }]}>Завершить работу</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {order.status === 'READY_TO_CONFIRM' && order.masterId === user?.id && (
                        <View style={[styles.infoBox, { backgroundColor: theme.tint + '10' }]}>
                            <Ionicons name="time-outline" size={20} color={theme.tint} />
                            <Text style={[styles.infoText, { color: theme.text }]}>Waiting for client to confirm completion</Text>
                        </View>
                    )}
                </View>
            )}

            {isOwner && (
                <View style={[styles.footer, { borderTopColor: theme.text + '10' }]}>
                    <View style={styles.ownerActions}>
                        {order.status === 'ACTIVE' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FF950020' }]}
                                onPress={() => handleAction('PAUSE')}
                            >
                                <Ionicons name="pause" size={18} color="#FF9500" />
                                <Text style={[styles.actionBtnText, { color: '#FF9500' }]}>Pause</Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'PAUSED' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#34C75920' }]}
                                onPress={() => handleAction('RESUME')}
                            >
                                <Ionicons name="play" size={18} color="#34C759" />
                                <Text style={[styles.actionBtnText, { color: '#34C759' }]}>Resume</Text>
                            </TouchableOpacity>
                        )}
                        {(order.status === 'ACTIVE' || order.status === 'PAUSED') && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: theme.text + '10' }]}
                                onPress={() => handleAction('ARCHIVE')}
                            >
                                <Ionicons name="archive-outline" size={18} color={theme.text} />
                                <Text style={[styles.actionBtnText, { color: theme.text }]}>Archive</Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'READY_TO_CONFIRM' && (
                            <TouchableOpacity
                                style={[styles.applyBtn, { backgroundColor: '#34C759', flex: 1 }]}
                                onPress={handleConfirmCompletion}
                            >
                                <Ionicons name="ribbon-outline" size={20} color="#fff" />
                                <Text style={[styles.applyBtnText, { color: '#fff' }]}>Confirm & Rate</Text>
                            </TouchableOpacity>
                        )}
                        {(order.status === 'ACTIVE' || order.status === 'PAUSED' || order.status === 'DRAFT') && (
                            <TouchableOpacity
                                style={[styles.editBtn, { borderColor: theme.tint }]}
                                onPress={() => router.push({
                                    pathname: '/create-job',
                                    params: { id, data: JSON.stringify(order) }
                                })}
                            >
                                <Ionicons name="create-outline" size={20} color={theme.tint} />
                                <Text style={[styles.editBtnText, { color: theme.tint }]}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        fontSize: 14,
        marginLeft: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 25,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    applyBtn: {
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    imageScroll: {
        marginBottom: 20,
    },
    detailImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginRight: 12,
    },
    detailsGrid: {
        marginTop: 10,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    detailTextContainer: {
        marginLeft: 10,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    conditionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    conditionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        margin: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    conditionLabel: {
        fontSize: 12,
        marginLeft: 6,
        fontWeight: '500',
    },
    appsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    appsBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appsLinkContent: {
        flex: 1,
    },
    appsLinkTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    appsLinkSubtitle: {
        fontSize: 13,
    },
    statusCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        marginTop: 20,
    },
    statusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    appStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    appStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    rejectionBox: {
        backgroundColor: '#FF3B3008',
        padding: 12,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FF3B3020',
    },
    rejectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    rejectionText: {
        fontSize: 14,
        lineHeight: 20,
    },
    appDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    appDetailItem: {
        flex: 1,
    },
    appDetailLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    appDetailValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    withdrawBtn: {
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF3B3033',
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawBtnText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: 'bold',
    },
    ownerActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        flex: 1,
        minWidth: '45%',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        flex: 1,
        minWidth: '100%',
        justifyContent: 'center',
        marginTop: 10,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    infoText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
});
