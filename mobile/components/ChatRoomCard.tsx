import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ChatRoom } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ChatRoomCardProps {
    room: ChatRoom;
    currentUserId: string;
    onPress: (roomId: string) => void;
}

export default function ChatRoomCard({ room, currentUserId, onPress }: ChatRoomCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Get the other participant (not current user)
    const otherParticipant = room.participants.find(p => p.userId !== currentUserId);
    const unreadCount = room.participants.find(p => p.userId === currentUserId)?.unreadCount || 0;

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}
            onPress={() => onPress(room.id)}
            activeOpacity={0.7}
        >
            <Image
                source={otherParticipant?.user.avatar || 'https://via.placeholder.com/50'}
                style={styles.avatar}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {otherParticipant?.user.firstName} {otherParticipant?.user.lastName}
                    </Text>
                    <Text style={[styles.time, { color: theme.text + '66' }]}>
                        {formatTime(room.lastMessageAt)}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text
                        style={[styles.lastMessage, { color: theme.text + '99' }]}
                        numberOfLines={1}
                    >
                        {room.lastMessage || 'No messages yet'}
                    </Text>
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                    )}
                </View>

                {room.orderId && (
                    <View style={styles.contextRow}>
                        <Ionicons name="briefcase-outline" size={12} color={theme.text + '66'} />
                        <Text style={[styles.contextText, { color: theme.text + '66' }]}>Order Chat</Text>
                    </View>
                )}
            </View>

            {otherParticipant?.user.isOnline && (
                <View style={styles.onlineIndicator} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    time: {
        fontSize: 12,
        marginLeft: 8,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    contextText: {
        fontSize: 12,
    },
    onlineIndicator: {
        position: 'absolute',
        top: 20,
        left: 54,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: 'white',
    },
});
