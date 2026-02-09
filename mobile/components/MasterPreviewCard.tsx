import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface MasterPreview {
    id?: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    rating: string;
    reviewsCount: number;
    city?: string;
    categories?: number[] | string[];
}

interface MasterPreviewCardProps {
    master: MasterPreview;
    onPress: () => void;
}

export default function MasterPreviewCard({ master, onPress }: MasterPreviewCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={master.avatar || 'https://via.placeholder.com/80'}
                style={styles.avatar}
            />
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {master.firstName || ''} {master.lastName || ''}
            </Text>
            <View style={styles.rating}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={[styles.ratingText, { color: theme.text + '99' }]}>
                    {parseFloat(master.rating).toFixed(1)} ({master.reviewsCount})
                </Text>
            </View>
            {master.city && (
                <View style={styles.location}>
                    <Ionicons name="location-outline" size={12} color={theme.text + '66'} />
                    <Text style={[styles.locationText, { color: theme.text + '66' }]} numberOfLines={1}>
                        {master.city}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 120,
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
    },
    location: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    locationText: {
        fontSize: 11,
    },
});
