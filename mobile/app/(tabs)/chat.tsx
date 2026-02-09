import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, ChatRoom } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { useWebSocket } from '@/src/context/WebSocketContext';
import { Header, SearchBar } from '@/components/ui';
import ChatRoomCard from '@/components/ChatRoomCard';

export default function ChatScreen() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();
    const { subscribe } = useWebSocket();

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

    // WebSocket listener for real-time updates
    useEffect(() => {
        const unsubscribe = subscribe((wsMessage) => {
            switch (wsMessage.type) {
                case 'message':
                    // Update room's last message
                    setRooms(prev => {
                        const updated = prev.map(room => {
                            if (room.id === wsMessage.data.roomId) {
                                return {
                                    ...room,
                                    lastMessage: wsMessage.data.content,
                                    lastMessageAt: wsMessage.data.createdAt,
                                };
                            }
                            return room;
                        });
                        // Sort by last message time
                        return updated.sort((a, b) => 
                            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                        );
                    });
                    break;
            }
        });

        return unsubscribe;
    }, [subscribe]);

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

    const filteredRooms = Array.isArray(rooms) ? rooms.filter(room => {
        if (!searchQuery) return true;
        const otherUser = room.participants?.find(p => p.id !== user?.id);
        const name = `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    }) : [];

    const totalUnread = Array.isArray(rooms) 
        ? rooms.reduce((sum, room) => {
            const participant = room.participants.find(p => p.userId === user?.id);
            return sum + (participant?.unreadCount || 0);
        }, 0)
        : 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header 
                title="Messages" 
                subtitle={totalUnread > 0 
                    ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
                    : `${Array.isArray(rooms) ? rooms.length : 0} conversation${rooms.length !== 1 ? 's' : ''}`
                } 
            />

            {Array.isArray(rooms) && rooms.length > 0 && (
                <View style={styles.searchContainer}>
                    <SearchBar
                        placeholder="Search conversations..."
                        onSearch={setSearchQuery}
                        value={searchQuery}
                    />
                </View>
            )}

            {filteredRooms.length === 0 ? (
                <View style={styles.centered}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: theme.tint + '10' }]}>
                        <Ionicons name="chatbubbles-outline" size={48} color={theme.tint} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        {searchQuery ? 'No results found' : 'No Messages'}
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.text + '66' }]}>
                        {searchQuery ? 'Try a different search' : 'Your conversations will appear here'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredRooms}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatRoomCard
                            room={item}
                            currentUserId={user?.id || ''}
                            onPress={handleRoomPress}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.tint}
                        />
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
        padding: 20,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
