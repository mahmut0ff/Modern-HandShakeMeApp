import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/src/api/chat';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    showSender?: boolean;
}

export default function MessageBubble({ message, isOwnMessage, showSender }: MessageBubbleProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (message.type === 'SYSTEM') {
        return (
            <View style={styles.systemContainer}>
                <Text style={[styles.systemText, { color: theme.text + '66' }]}>
                    {message.content}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
            {showSender && !isOwnMessage && message.sender && (
                <Text style={[styles.senderName, { color: theme.text + '99' }]}>
                    {message.sender.firstName} {message.sender.lastName}
                </Text>
            )}

            {message.type === 'IMAGE' && message.fileUrl && (
                <Image
                    source={message.fileUrl}
                    style={styles.image}
                    contentFit="cover"
                />
            )}

            {message.content && (
                <View
                    style={[
                        styles.bubble,
                        isOwnMessage
                            ? { backgroundColor: theme.tint }
                            : { backgroundColor: theme.card },
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            { color: isOwnMessage ? 'white' : theme.text },
                        ]}
                    >
                        {message.content}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={[styles.time, { color: theme.text + '66' }]}>
                    {formatTime(message.createdAt)}
                </Text>
                {isOwnMessage && (
                    <View style={styles.statusContainer}>
                        {Object.keys(message.readBy).length > 0 ? (
                            <Ionicons name="checkmark-done" size={14} color={theme.tint} />
                        ) : (
                            <Ionicons name="checkmark" size={14} color={theme.text + '66'} />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        marginHorizontal: 16,
        maxWidth: '75%',
    },
    ownMessage: {
        alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        marginBottom: 4,
        marginLeft: 12,
    },
    bubble: {
        borderRadius: 16,
        padding: 12,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginHorizontal: 12,
    },
    time: {
        fontSize: 11,
    },
    statusContainer: {
        marginLeft: 4,
    },
    systemContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
