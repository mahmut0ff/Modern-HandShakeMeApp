import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatApi, Message, ChatRoom } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { useWebSocket } from '@/src/context/WebSocketContext';
import ChatHeader from '@/components/chat/ChatHeader';
import OrderContextCard from '@/components/chat/OrderContextCard';
import ChatMessage from '@/components/chat/ChatMessage';
import DateSeparator from '@/components/chat/DateSeparator';
import EmptyChatState from '@/components/chat/EmptyChatState';
import ScrollToBottomButton from '@/components/chat/ScrollToBottomButton';

interface GroupedMessage extends Message {
    showAvatar?: boolean;
    showTimestamp?: boolean;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    showDateSeparator?: boolean;
}

export default function ChatRoomScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();
    const { isConnected, sendMessage: wsSendMessage, sendTyping, markRead: wsMarkRead, subscribe } = useWebSocket();
    const insets = useSafeAreaInsets();

    const [room, setRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [groupedMessages, setGroupedMessages] = useState<GroupedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<TextInput>(null);

    // Get other participant
    const otherParticipant = room?.participants?.find(p => p.userId !== user?.id);
    const participantName = otherParticipant?.user 
        ? `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() || 'Unknown User'
        : 'Unknown User';

    // Group messages with date separators
    useEffect(() => {
        const grouped: GroupedMessage[] = [];
        let lastDate: string | null = null;

        for (let i = 0; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];
            const next = messages[i + 1];

            // Check if we need a date separator
            const currentDate = new Date(current.createdAt).toDateString();
            const showDateSeparator = currentDate !== lastDate;
            lastDate = currentDate;

            // Check grouping
            const isFirstInGroup = !prev || prev.senderId !== current.senderId ||
                new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() > 60000;
            const isLastInGroup = !next || next.senderId !== current.senderId ||
                new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime() > 60000;
            
            const showAvatar = isLastInGroup && current.senderId !== user?.id;
            const showTimestamp = isLastInGroup;

            grouped.push({
                ...current,
                showAvatar,
                showTimestamp,
                isFirstInGroup,
                isLastInGroup,
                showDateSeparator,
            });
        }

        setGroupedMessages(grouped);
    }, [messages, user?.id]);

    const fetchRoom = useCallback(async () => {
        if (!roomId) return;
        try {
            const response = await chatApi.getRoom(roomId);
            setRoom(response.data);
        } catch (error) {
            console.error('Failed to fetch room', error);
        }
    }, [roomId]);

    const fetchMessages = useCallback(async (loadMore = false) => {
        if (!roomId) return;
        try {
            const lastMessageId = loadMore && messages.length > 0 ? messages[messages.length - 1].id : undefined;
            const response = await chatApi.getMessages(roomId, { limit: 50, lastMessageId });

            if (loadMore) {
                setMessages(prev => [...prev, ...(response.data || [])]);
            } else {
                setMessages(response.data || []);
            }

            setHasMore((response.data || []).length === 50);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsLoading(false);
        }
    }, [roomId, messages.length]);

    useEffect(() => {
        fetchRoom();
        fetchMessages();

        if (roomId) {
            chatApi.markRoomRead(roomId).catch(console.error);
            wsMarkRead(roomId);
        }

        // Scroll to bottom on initial load
        setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }, 300);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (roomId) {
                sendTyping(roomId, false);
            }
        };
    }, [roomId]);

    // WebSocket listener
    useEffect(() => {
        if (!roomId) return;

        const unsubscribe = subscribe((wsMessage) => {
            switch (wsMessage.type) {
                case 'message':
                    if (wsMessage.data.roomId === roomId) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === wsMessage.data.id)) {
                                return prev;
                            }
                            return [wsMessage.data, ...prev];
                        });
                        
                        // Auto scroll if near bottom
                        if (isNearBottom) {
                            setTimeout(() => {
                                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                            }, 100);
                        } else {
                            setShowScrollToBottom(true);
                        }
                        
                        wsMarkRead(roomId, wsMessage.data.id);
                    }
                    break;

                case 'typing':
                    if (wsMessage.data.roomId === roomId && wsMessage.data.userId !== user?.id) {
                        setTypingUsers(prev => {
                            const next = new Set(prev);
                            if (wsMessage.data.isTyping) {
                                next.add(wsMessage.data.userId);
                            } else {
                                next.delete(wsMessage.data.userId);
                            }
                            return next;
                        });
                    }
                    break;

                case 'messageRead':
                    if (wsMessage.data.roomId === roomId) {
                        setMessages(prev => prev.map(msg => {
                            if (msg.id === wsMessage.data.messageId || !wsMessage.data.messageId) {
                                return {
                                    ...msg,
                                    readBy: {
                                        ...msg.readBy,
                                        [wsMessage.data.userId]: wsMessage.data.timestamp
                                    }
                                };
                            }
                            return msg;
                        }));
                    }
                    break;
            }
        });

        return unsubscribe;
    }, [roomId, user?.id, subscribe, wsMarkRead, isNearBottom]);

    const handleSend = async () => {
        if (!messageText.trim() || !roomId) return;

        const content = messageText.trim();
        setMessageText('');
        setIsSending(true);
        sendTyping(roomId, false);

        try {
            if (isConnected) {
                wsSendMessage(roomId, content, 'TEXT');
            } else {
                const tempMessage: Message = {
                    id: `temp-${Date.now()}`,
                    roomId,
                    senderId: user?.id || '',
                    type: 'TEXT',
                    content,
                    isEdited: false,
                    isRead: false,
                    readBy: {},
                    createdAt: new Date().toISOString(),
                    sender: {
                        id: user?.id || '',
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        avatar: user?.avatar,
                    },
                };

                setMessages(prev => [tempMessage, ...prev]);

                const response = await chatApi.sendMessage(roomId, {
                    content,
                    type: 'TEXT',
                });

                setMessages(prev =>
                    prev.map(msg => (msg.id === tempMessage.id ? response.data : msg))
                );
            }
            
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleTextChange = (text: string) => {
        setMessageText(text);

        if (text.length > 0 && roomId) {
            sendTyping(roomId, true);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(roomId, false);
            }, 2000);
        } else if (roomId) {
            sendTyping(roomId, false);
        }
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const nearBottom = offsetY < 100;
        setIsNearBottom(nearBottom);
        
        if (nearBottom) {
            setShowScrollToBottom(false);
        }
    };

    const scrollToBottom = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowScrollToBottom(false);
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchMessages(true);
        }
    };

    const getStatusText = () => {
        if (!isConnected) return 'Connecting...';
        if (typingUsers.size > 0) return 'typing...';
        if (otherParticipant?.user?.isOnline) return 'Online';
        return 'был недавно';
    };

    const handleProfilePress = () => {
        if (otherParticipant?.userId) {
            router.push(`/masters/${otherParticipant.userId}` as any);
        }
    };

    const handleOrderPress = () => {
        if (room?.orderId) {
            router.push(`/jobs/${room.orderId}` as any);
        }
    };

    const renderItem = ({ item }: { item: GroupedMessage }) => (
        <>
            {item.showDateSeparator && <DateSeparator date={item.createdAt} theme={theme} />}
            <ChatMessage
                content={item.content}
                type={item.type}
                isOwnMessage={item.senderId === user?.id}
                showAvatar={item.showAvatar}
                showTimestamp={item.showTimestamp}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
                avatar={item.sender?.avatar}
                timestamp={item.createdAt}
                isRead={Object.keys(item.readBy).length > 1}
                fileUrl={item.fileUrl}
                theme={theme}
            />
        </>
    );

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <ChatHeader
                avatar={otherParticipant?.user?.avatar}
                name={participantName}
                status={getStatusText()}
                userId={otherParticipant?.userId}
                onProfilePress={handleProfilePress}
                onOrderPress={room?.orderId ? handleOrderPress : undefined}
                theme={theme}
            />

            {room?.orderId && (
                <OrderContextCard
                    orderTitle="Order Title"
                    orderStatus="IN_PROGRESS"
                    orderPrice={1000}
                    onPress={handleOrderPress}
                    theme={theme}
                />
            )}

            {groupedMessages.length === 0 ? (
                <EmptyChatState
                    avatar={otherParticipant?.user?.avatar}
                    name={participantName}
                    theme={theme}
                />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={groupedMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    inverted
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={styles.messagesList}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                />
            )}

            {showScrollToBottom && (
                <View style={styles.scrollToBottomContainer}>
                    <ScrollToBottomButton onPress={scrollToBottom} theme={theme} />
                </View>
            )}

            <View 
                style={[
                    styles.inputContainer, 
                    { 
                        backgroundColor: theme.card, 
                        borderTopColor: theme.text + '10',
                        paddingBottom: Platform.OS === 'ios' 
                            ? Math.max(insets.bottom, 8)
                            : 8,
                    }
                ]}
            >
                <TouchableOpacity style={styles.attachButton} disabled={isSending}>
                    <Ionicons name="image-outline" size={24} color={theme.tint} />
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.text + '66'}
                    value={messageText}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={1000}
                    editable={!isSending}
                />

                <TouchableOpacity
                    onPress={handleSend}
                    style={[styles.sendButton, { backgroundColor: theme.tint }]}
                    disabled={!messageText.trim() || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="send" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    messagesList: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    scrollToBottomContainer: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        zIndex: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 8,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
