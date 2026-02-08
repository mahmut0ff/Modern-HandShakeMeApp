import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '@/src/api/auth';
import * as Device from 'expo-device';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const handleGetCode = async () => {
        setLoading(true);
        setError(null);
        try {
            const visitorId = Device.osInternalBuildId || 'unknown-device';
            const response = await authApi.getCode(visitorId);
            const { code, sessionId } = response.data;

            // Navigate to verification screen with the code and sessionId
            router.push({
                pathname: '/(auth)/verify',
                params: { code, sessionId }
            });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to generate code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>HandShakeMe</Text>
            <Text style={[styles.subtitle, { color: theme.text + '99' }]}>Enter via Telegram</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
                style={styles.button}
                onPress={handleGetCode}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Get Login Code</Text>
                )}
            </TouchableOpacity>

            <Text style={[styles.infoText, { color: theme.text + '66' }]}>
                You will need to send this code to our Telegram bot to authorize.
            </Text>
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
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#0088cc', // Telegram Blue
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 20,
        textAlign: 'center',
    },
    infoText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
});
