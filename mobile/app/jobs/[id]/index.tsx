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
            }
        } catch (error) {
            console.error('Failed to fetch job details', error);
            Alert.alert('Error', 'Failed to load job details');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [id, user?.id]);

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
    const hasApplied = (applications || []).some(app => app.master_id === user?.id);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>Job Details</Text>
                {isOwner ? (
                    <TouchableOpacity onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

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
                                {new Date(order.createdAt).toLocaleDateString()}
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
            </ScrollView>

            {!isOwner && isMaster && (
                <View style={[styles.footer, { borderTopColor: theme.text + '10' }]}>
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
                </View>
            )}

            {isOwner && (
                <View style={[styles.footer, { borderTopColor: theme.text + '10' }]}>
                    <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                        onPress={() => router.push({
                            pathname: '/create-job',
                            params: {
                                id: id,
                                data: JSON.stringify(order)
                            }
                        })}
                    >
                        <Ionicons name="create-outline" size={20} color={theme.onPrimary} />
                        <Text style={[styles.applyBtnText, { color: theme.onPrimary }]}>Edit Job</Text>
                    </TouchableOpacity>
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
});
