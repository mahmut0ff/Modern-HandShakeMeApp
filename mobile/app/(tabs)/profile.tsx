import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { user, signOut, switchRole } = useAuth();
    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchRole = async () => {
        Alert.alert(
            'Switch Role',
            `Are you sure you want to switch to ${user?.role === 'MASTER' ? 'Client' : 'Master'} role?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    onPress: async () => {
                        setIsSwitching(true);
                        try {
                            await switchRole();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to switch role. Please try again.');
                        } finally {
                            setIsSwitching(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color="#ccc" />
                </View>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.role}>{user?.role}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{user?.phone || 'No phone'}</Text>
                    </View>
                    {user?.telegramUsername && (
                        <View style={styles.infoRow}>
                            <Ionicons name="paper-plane-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>@{user.telegramUsername}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <View style={styles.menuSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleSwitchRole}
                        disabled={isSwitching}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="repeat-outline" size={22} color="#007AFF" />
                            <Text style={styles.menuItemText}>
                                Switch to {user?.role === 'MASTER' ? 'Client' : 'Master'} Role
                            </Text>
                        </View>
                        {isSwitching ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    role: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 5,
    },
    infoSection: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
    },
    menuSection: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#000',
        marginLeft: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ff3b30',
        borderRadius: 12,
        marginTop: 'auto',
        marginBottom: 20,
    },
    signOutText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
