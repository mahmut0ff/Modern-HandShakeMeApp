import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { chatApi, ChatRoom } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import ChatRoomCard from '@/components/ChatRoomCard';

export default function ChatScreen() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const fetchRooms = useCallback(async () => {
        try {
            const response = await chatApi.listRooms();
            setRooms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch chat rooms', error);
            setRooms([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
    };

    const handleRoomPress = (roomId: string) => {
        router.push(`/chat/${roomId}`);
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (rooms.length === 0) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Messages</Text>
                <Text style={[styles.emptySubtitle, { color: theme.text + '66' }]}>
                    Your conversations will appear here
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ChatRoomCard
                        room={item}
                        currentUserId={user?.id || ''}
                        onPress={handleRoomPress}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.tint}
                    />
                }
            />
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
        padding: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
});
