import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, Card, Button } from '@/components/ui';

export default function SettingsScreen() {
    const { user, signOut, switchRole } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isSwitching, setIsSwitching] = useState(false);
    const [notifications, setNotifications] = useState({
        newMessages: true,
        newApplications: true,
        orderUpdates: true,
        pushNotifications: true,
    });

    const handleSwitchRole = async () => {
        Alert.alert(
            'Switch Role',
            `Switch to ${user?.role === 'MASTER' ? 'Client' : 'Master'} mode?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    onPress: async () => {
                        setIsSwitching(true);
                        try {
                            await switchRole();
                            Alert.alert('Success', 'Role switched successfully');
                        } catch (error) {
                            console.error('Failed to switch role', error);
                            Alert.alert('Error', 'Failed to switch role. Please try again.');
                        } finally {
                            setIsSwitching(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement account deletion
                        Alert.alert('Info', 'Account deletion will be implemented soon');
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text + '66' }]}>ACCOUNT</Text>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.text + '10' }]}
                            onPress={() => router.push('/profile/edit' as any)}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="person-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.item, { borderBottomWidth: 0 }]}
                            onPress={handleSwitchRole}
                            disabled={isSwitching}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="repeat-outline" size={22} color={theme.tint} />
                                <Text style={[styles.itemText, { color: theme.text }]}>
                                    Switch to {user?.role === 'MASTER' ? 'Client' : 'Master'} Mode
                                </Text>
                            </View>
                            {isSwitching ? (
                                <ActivityIndicator size="small" color={theme.tint} />
                            ) : (
                                <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text + '66' }]}>NOTIFICATIONS</Text>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={[styles.item, { borderBottomColor: theme.text + '10' }]}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>New Messages</Text>
                            </View>
                            <Switch
                                value={notifications.newMessages}
                                onValueChange={(value) => setNotifications({ ...notifications, newMessages: value })}
                                trackColor={{ false: theme.text + '20', true: theme.tint + '60' }}
                                thumbColor={notifications.newMessages ? theme.tint : '#f4f3f4'}
                            />
                        </View>

                        <View style={[styles.item, { borderBottomColor: theme.text + '10' }]}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="paper-plane-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>New Applications</Text>
                            </View>
                            <Switch
                                value={notifications.newApplications}
                                onValueChange={(value) => setNotifications({ ...notifications, newApplications: value })}
                                trackColor={{ false: theme.text + '20', true: theme.tint + '60' }}
                                thumbColor={notifications.newApplications ? theme.tint : '#f4f3f4'}
                            />
                        </View>

                        <View style={[styles.item, { borderBottomColor: theme.text + '10' }]}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="document-text-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>Order Updates</Text>
                            </View>
                            <Switch
                                value={notifications.orderUpdates}
                                onValueChange={(value) => setNotifications({ ...notifications, orderUpdates: value })}
                                trackColor={{ false: theme.text + '20', true: theme.tint + '60' }}
                                thumbColor={notifications.orderUpdates ? theme.tint : '#f4f3f4'}
                            />
                        </View>

                        <View style={[styles.item, { borderBottomWidth: 0 }]}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="notifications-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>Push Notifications</Text>
                            </View>
                            <Switch
                                value={notifications.pushNotifications}
                                onValueChange={(value) => setNotifications({ ...notifications, pushNotifications: value })}
                                trackColor={{ false: theme.text + '20', true: theme.tint + '60' }}
                                thumbColor={notifications.pushNotifications ? theme.tint : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>

                {/* Privacy Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text + '66' }]}>PRIVACY</Text>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.text + '10' }]}
                            onPress={() => Alert.alert('Info', 'Privacy settings will be implemented soon')}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="eye-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>Profile Visibility</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.item, { borderBottomWidth: 0 }]}
                            onPress={() => Alert.alert('Info', 'Privacy settings will be implemented soon')}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="shield-outline" size={22} color={theme.text} />
                                <Text style={[styles.itemText, { color: theme.text }]}>Who Can Message Me</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text + '66' }]}>SECURITY</Text>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={[styles.item, { borderBottomColor: theme.text + '10' }]}
                            onPress={signOut}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
                                <Text style={[styles.itemText, { color: '#ff3b30' }]}>Sign Out</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.item, { borderBottomWidth: 0 }]}
                            onPress={handleDeleteAccount}
                        >
                            <View style={styles.itemLeft}>
                                <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                                <Text style={[styles.itemText, { color: '#ff3b30' }]}>Delete Account</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.text + '40'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    itemText: {
        fontSize: 16,
    },
});
