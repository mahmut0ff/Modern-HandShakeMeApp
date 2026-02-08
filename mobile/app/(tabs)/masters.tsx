import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { mastersApi, MasterProfile } from '@/src/api/masters';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MasterCard from '@/components/MasterCard';

export default function MastersScreen() {
    const [masters, setMasters] = useState<MasterProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const fetchMasters = useCallback(async () => {
        try {
            const response = await mastersApi.listMasters({
                with_portfolio: true,
                page_size: 20
            });
            setMasters(response.data.data);
        } catch (error) {
            console.error('Failed to fetch masters', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMasters();
    }, [fetchMasters]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMasters();
    };

    const handleMasterPress = (id: string) => {
        router.push(`/masters/${id}`);
    };

    const handleWrite = (id: string) => {
        router.push(`/chat?recipientId=${id}`);
    };

    const handleCreateOrder = (id: string) => {
        router.push({
            pathname: '/create-job',
            params: { masterId: id }
        });
    };

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>Find Experts</Text>
                    <Text style={[styles.subtitle, { color: theme.text + '99' }]}>
                        {masters.length} specialists available
                    </Text>
                </View>
                <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card }]}>
                    <Ionicons name="options-outline" size={20} color={theme.tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={masters}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                    <MasterCard
                        master={item}
                        onPress={handleMasterPress}
                        onWrite={handleWrite}
                        onCreateOrder={handleCreateOrder}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={theme.text + '33'} />
                        <Text style={[styles.emptyText, { color: theme.text + '99' }]}>
                            No specialists found in your area.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60, // Account for notch/header
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
});
