import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface ChatHeaderProps {
    avatar?: string;
    name: string;
    status: string;
    userId?: string;
    onProfilePress?: () => void;
    onOrderPress?: () => void;
    theme: any;
}

export default function ChatHeader({ avatar, name, status, userId, onProfilePress, onOrderPress, theme }: ChatHeaderProps) {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    const handleMenuPress = () => {
        setMenuVisible(true);
    };

    const handleMenuClose = () => {
        setMenuVisible(false);
    };

    const handleViewProfile = () => {
        setMenuVisible(false);
        if (onProfilePress) {
            onProfilePress();
        } else if (userId) {
            router.push(`/masters/${userId}` as any);
        }
    };

    const handleMute = () => {
        setMenuVisible(false);
        Alert.alert('Mute', 'Mute notifications feature coming soon');
    };

    const handleBlock = () => {
        setMenuVisible(false);
        Alert.alert(
            'Block User',
            'Are you sure you want to block this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Block', style: 'destructive', onPress: () => {
                    // TODO: Implement block functionality
                    Alert.alert('Blocked', 'User has been blocked');
                }}
            ]
        );
    };

    const handleReport = () => {
        setMenuVisible(false);
        Alert.alert('Report', 'Report feature coming soon');
    };

    return (
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerCenter} onPress={handleViewProfile} activeOpacity={0.7}>
                {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                    <LinearGradient
                        colors={[theme.tint + '40', theme.tint + '20']}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="person" size={20} color={theme.tint} />
                    </LinearGradient>
                )}
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.text + '66' }]} numberOfLines={1}>
                        {status}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerActions}>
                {onOrderPress && (
                    <TouchableOpacity onPress={onOrderPress} style={styles.iconButton}>
                        <Ionicons name="document-text-outline" size={22} color={theme.text} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
                    <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={handleMenuClose}
            >
                <Pressable style={styles.modalOverlay} onPress={handleMenuClose}>
                    <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
                        <TouchableOpacity 
                            style={[styles.menuItem, { borderBottomColor: theme.text + '10' }]}
                            onPress={handleViewProfile}
                        >
                            <Ionicons name="person-outline" size={20} color={theme.text} />
                            <Text style={[styles.menuText, { color: theme.text }]}>View Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.menuItem, { borderBottomColor: theme.text + '10' }]}
                            onPress={handleMute}
                        >
                            <Ionicons name="notifications-off-outline" size={20} color={theme.text} />
                            <Text style={[styles.menuText, { color: theme.text }]}>Mute Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.menuItem, { borderBottomColor: theme.text + '10' }]}
                            onPress={handleReport}
                        >
                            <Ionicons name="flag-outline" size={20} color={theme.text} />
                            <Text style={[styles.menuText, { color: theme.text }]}>Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={handleBlock}
                        >
                            <Ionicons name="ban-outline" size={20} color="#FF3B30" />
                            <Text style={[styles.menuText, { color: '#FF3B30' }]}>Block User</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 60,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 110,
        paddingRight: 16,
    },
    menuContainer: {
        borderRadius: 12,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    menuText: {
        fontSize: 15,
        marginLeft: 12,
        fontWeight: '500',
    },
});
