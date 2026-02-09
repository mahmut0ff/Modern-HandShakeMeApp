import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { chatApi, Message } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { useWebSocket } from '@/src/context/WebSocketContext';
import MessageBubble from '@/components/MessageBubble';

export default function ChatRoomScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();
    const { isConnected, sendMessage: wsSendMessage, sendTyping, markRead: wsMarkRead, subscribe } = useWebSocket();

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

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
        fetchMessages();
        // Mark room as read when opening
        if (roomId) {
            chatApi.markRoomRead(roomId).catch(console.error);
            wsMarkRead(roomId);
        }

        // Cleanup typing timeout on unmount
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (roomId) {
                sendTyping(roomId, false);
            }
        };
    }, [roomId]);

    // WebSocket message listener
    useEffect(() => {
        if (!roomId) return;

        const unsubscribe = subscribe((wsMessage) => {
            switch (wsMessage.type) {
                case 'message':
                    // New message received
                    if (wsMessage.data.roomId === roomId) {
                        setMessages(prev => {
                            // Avoid duplicates
                            if (prev.some(m => m.id === wsMessage.data.id)) {
                                return prev;
                            }
                            return [wsMessage.data, ...prev];
                        });
                        // Auto mark as read
                        wsMarkRead(roomId, wsMessage.data.id);
                    }
                    break;

                case 'typing':
                    // Typing indicator
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
                    // Update read status
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
    }, [roomId, user?.id, subscribe, wsMarkRead]);

    const handleSend = async () => {
        if (!messageText.trim() || !roomId) return;

        const content = messageText.trim();
        setMessageText('');
        setIsSending(true);

        // Stop typing indicator
        sendTyping(roomId, false);

        try {
            if (isConnected) {
                // Send via WebSocket (faster)
                wsSendMessage(roomId, content, 'TEXT');
            } else {
                // Fallback to REST API
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

                // Replace temp message with real one
                setMessages(prev =>
                    prev.map(msg => (msg.id === tempMessage.id ? response.data : msg))
                );
            }
        } catch (error) {
            console.error('Failed to send message', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleTextChange = (text: string) => {
        setMessageText(text);

        // Send typing indicator
        if (text.length > 0 && roomId) {
            sendTyping(roomId, true);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(roomId, false);
            }, 2000);
        } else if (roomId) {
            sendTyping(roomId, false);
        }
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0] && roomId) {
            setIsSending(true);
            try {
                const response = await chatApi.sendImage(roomId, result.assets[0].uri);
                setMessages(prev => [response.data, ...prev]);
            } catch (error) {
                console.error('Failed to send image', error);
                Alert.alert('Error', 'Failed to send image. Please try again.');
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchMessages(true);
        }
    };

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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Chat</Text>
                    {!isConnected && (
                        <Text style={[styles.headerSubtitle, { color: theme.text + '66' }]}>Connecting...</Text>
                    )}
                    {typingUsers.size > 0 && (
                        <Text style={[styles.headerSubtitle, { color: theme.tint }]}>typing...</Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MessageBubble
                        message={item}
                        isOwnMessage={item.senderId === user?.id}
                        showSender={true}
                    />
                )}
                inverted
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.messagesList}
            />

            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={handleImagePick} style={styles.attachButton} disabled={isSending}>
                    <Ionicons name="image-outline" size={24} color={theme.tint} />
                </TouchableOpacity>

                <TextInput
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    messagesList: {
        paddingVertical: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
