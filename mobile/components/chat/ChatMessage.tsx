import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessageProps {
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
    isOwnMessage: boolean;
    showAvatar?: boolean;
    showTimestamp?: boolean;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    avatar?: string;
    timestamp: string;
    isRead?: boolean;
    fileUrl?: string;
    theme: any;
}

export default function ChatMessage({
    content,
    type,
    isOwnMessage,
    showAvatar,
    showTimestamp,
    isFirstInGroup,
    isLastInGroup,
    avatar,
    timestamp,
    isRead,
    fileUrl,
    theme,
}: ChatMessageProps) {
    // System message
    if (type === 'SYSTEM') {
        return (
            <View style={styles.systemMessageContainer}>
                <Text style={[styles.systemMessage, { color: theme.text + '66' }]}>
                    {content}
                </Text>
            </View>
        );
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const getBubbleStyle = () => {
        const baseStyle = [styles.bubble];
        
        if (isOwnMessage) {
            baseStyle.push(styles.ownBubble, { backgroundColor: theme.tint });
        } else {
            baseStyle.push(styles.otherBubble, { backgroundColor: theme.card });
        }

        // Adjust margins for grouping
        if (isFirstInGroup) {
            baseStyle.push(styles.firstInGroup);
        }
        if (!isLastInGroup) {
            baseStyle.push(styles.notLastInGroup);
        }

        return baseStyle;
    };

    return (
        <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
            {/* Avatar (only for other user's last message in group) */}
            {showAvatar && !isOwnMessage ? (
                avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                        <Ionicons name="person" size={16} color={theme.tint} />
                    </View>
                )
            ) : (
                <View style={styles.avatarSpacer} />
            )}

            <View style={styles.bubbleContainer}>
                {/* Image message */}
                {type === 'IMAGE' && fileUrl && (
                    <TouchableOpacity activeOpacity={0.9}>
                        <Image
                            source={{ uri: fileUrl }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}

                {/* Text bubble */}
                <View style={getBubbleStyle()}>
                    <Text style={[styles.messageText, { color: isOwnMessage ? '#FFFFFF' : theme.text }]}>
                        {content}
                    </Text>
                </View>

                {/* Timestamp and read status */}
                {showTimestamp && (
                    <View style={[styles.metaContainer, isOwnMessage && styles.ownMetaContainer]}>
                        <Text style={[styles.timestamp, { color: theme.text + '66' }]}>
                            {formatTime(timestamp)}
                        </Text>
                        {isOwnMessage && (
                            <Ionicons
                                name={isRead ? 'checkmark-done' : 'checkmark'}
                                size={14}
                                color={isRead ? theme.tint : theme.text + '66'}
                                style={styles.readIcon}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 2,
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSpacer: {
        width: 40,
    },
    bubbleContainer: {
        maxWidth: '75%',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    ownBubble: {
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        borderBottomLeftRadius: 4,
    },
    firstInGroup: {
        marginTop: 8,
    },
    notLastInGroup: {
        marginBottom: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    ownMetaContainer: {
        justifyContent: 'flex-end',
    },
    timestamp: {
        fontSize: 11,
    },
    readIcon: {
        marginLeft: 4,
    },
    systemMessageContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    systemMessage: {
        fontSize: 13,
        textAlign: 'center',
    },
});
