import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    
    // Get participant name with fallback
    const participantName = otherParticipant?.user 
        ? `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || 'Unknown User'
        : 'Unknown User';

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
            style={[
                styles.container, 
                { 
                    backgroundColor: theme.card,
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                        },
                        android: {
                            elevation: 2,
                        },
                    }),
                }
            ]}
            onPress={() => onPress(room.id)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                {otherParticipant?.user?.avatar ? (
                    <Image
                        source={{ uri: otherParticipant.user.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={[theme.tint + '40', theme.tint + '20']}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="person" size={24} color={theme.tint} />
                    </LinearGradient>
                )}
                {otherParticipant?.user?.isOnline && (
                    <View style={[styles.onlineIndicator, { borderColor: theme.card }]} />
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text 
                        style={[
                            styles.name, 
                            { color: theme.text },
                            unreadCount > 0 && styles.nameUnread
                        ]} 
                        numberOfLines={1}
                    >
                        {participantName}
                    </Text>
                    <Text style={[styles.time, { color: theme.text + '66' }]}>
                        {formatTime(room.lastMessageAt)}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text
                        style={[
                            styles.lastMessage, 
                            { color: theme.text + (unreadCount > 0 ? '99' : '66') },
                            unreadCount > 0 && styles.lastMessageUnread
                        ]}
                        numberOfLines={2}
                    >
                        {room.lastMessage || 'No messages yet'}
                    </Text>
                    {unreadCount > 0 && (
                        <LinearGradient
                            colors={[theme.tint, theme.tint + 'DD']}
                            style={styles.badge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </LinearGradient>
                    )}
                </View>

                {room.orderId && (
                    <View style={[styles.contextRow, { backgroundColor: theme.tint + '10' }]}>
                        <Ionicons name="briefcase-outline" size={12} color={theme.tint} />
                        <Text style={[styles.contextText, { color: theme.tint }]}>Order Chat</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    nameUnread: {
        fontWeight: '700',
    },
    time: {
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '500',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    lastMessageUnread: {
        fontWeight: '500',
    },
    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 7,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    contextText: {
        fontSize: 11,
        fontWeight: '600',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#34C759',
        borderWidth: 2.5,
    },
});
