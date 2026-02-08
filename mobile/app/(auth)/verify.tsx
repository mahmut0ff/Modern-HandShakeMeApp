import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '@/src/api/auth';
import { useAuth } from '@/src/context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VerifyScreen() {
    const { code, sessionId } = useLocalSearchParams<{ code: string; sessionId: string }>();
    const [status, setStatus] = useState<'pending' | 'confirmed'>('pending');
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    useEffect(() => {
        let interval: any;

        const checkStatus = async () => {
            try {
                const response = await authApi.checkStatus(sessionId);
                if (response.data.status === 'confirmed') {
                    setStatus('confirmed');
                    clearInterval(interval);
                    handleConfirmed(response.data);
                }
            } catch (e) {
                console.error('Status check failed', e);
            }
        };

        interval = setInterval(checkStatus, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [sessionId]);

    const handleConfirmed = async (telegramData: any) => {
        try {
            // Automatically register/login since we have confirmed Telegram ID
            const authResponse = await authApi.register({
                telegram_id: telegramData.telegramId,
                first_name: telegramData.firstName,
                last_name: telegramData.lastName,
                username: telegramData.username,
                photo_url: telegramData.photoUrl,
                role: 'MASTER', // Default role for this app
            });

            await signIn(authResponse.data);
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes('already exists')) {
                setError('User already exists. Please try logging in.');
            } else {
                setError('Authentication failed. Please try again.');
                console.error('Registration failed', e);
            }
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(code || '');
        Alert.alert('Copied!', 'The code has been copied to your clipboard.');
    };

    const openTelegramBot = () => {
        Linking.openURL('https://t.me/handshakeme_bot');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>Send this code to @handshakeme_bot</Text>

            <TouchableOpacity
                style={[styles.codeContainer, { backgroundColor: theme.text + '05', borderColor: theme.primary + '33' }]}
                onPress={copyToClipboard}
                activeOpacity={0.7}
            >
                <Text style={[styles.codeText, { color: theme.primary }]}>{code}</Text>
                <View style={styles.copyBadge}>
                    <Ionicons name="copy-outline" size={16} color={theme.primary} />
                    <Text style={[styles.copyBadgeText, { color: theme.primary }]}>TAP TO COPY</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.telegramButton} onPress={openTelegramBot}>
                <Ionicons name="paper-plane" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.telegramButtonText}>Open Telegram Bot</Text>
            </TouchableOpacity>

            <View style={styles.statusContainer}>
                {status === 'pending' ? (
                    <>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.statusText, { color: theme.text + '99' }]}>Waiting for confirmation...</Text>
                    </>
                ) : (
                    <Text style={styles.successText}>Confirmed! Logging you in...</Text>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 40,
        textAlign: 'center',
    },
    codeContainer: {
        paddingVertical: 25,
        paddingHorizontal: 40,
        borderRadius: 24,
        marginBottom: 30,
        alignItems: 'center',
        borderWidth: 1,
        width: '80%',
    },
    codeText: {
        fontSize: 54,
        fontWeight: 'bold',
        letterSpacing: 10,
    },
    copyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    copyBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 5,
    },
    telegramButton: {
        backgroundColor: '#0088cc',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 12,
        marginBottom: 40,
        width: '80%',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonIcon: {
        marginRight: 10,
    },
    telegramButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    statusContainer: {
        alignItems: 'center',
    },
    statusText: {
        marginTop: 15,
        fontSize: 16,
    },
    successText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34C759',
    },
    errorText: {
        color: '#FF3B30',
        marginTop: 20,
        textAlign: 'center',
    },
});
