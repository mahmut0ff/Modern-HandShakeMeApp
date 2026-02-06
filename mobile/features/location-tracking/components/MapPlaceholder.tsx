import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';

interface MapPlaceholderProps {
    message?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
    message = 'Maps require a development build'
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="map-outline" size={64} color="#9CA3AF" />
                <Text style={styles.title}>Map Not Available</Text>
                <Text style={styles.message}>{message}</Text>
                <Text style={styles.hint}>
                    {Device.isDevice
                        ? 'Build with EAS to enable maps:\nnpx eas build --profile development'
                        : 'Maps are not available in Expo Go.\nUse a development build to test this feature.'
                    }
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 300,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    hint: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        backgroundColor: '#E5E7EB',
        padding: 12,
        borderRadius: 8,
    },
});
