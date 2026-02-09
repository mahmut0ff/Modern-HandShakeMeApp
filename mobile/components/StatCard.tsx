import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatCardProps {
    title?: string;
    label?: string; // Alias for title (for backward compatibility)
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    gradient?: [string, string];
    onPress?: () => void;
    subtitle?: string;
    variant?: 'default' | 'compact'; // New prop for different sizes
}

export default function StatCard({ 
    title, 
    label, 
    value, 
    icon, 
    gradient, 
    onPress, 
    subtitle,
    variant = 'default'
}: StatCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const displayTitle = title || label;
    const isCompact = variant === 'compact';
    
    // Use theme color for all cards (unified style)
    const defaultGradient: [string, string] = gradient || [theme.tint, theme.tint + 'DD'];

    const Content = (
        <LinearGradient
            colors={defaultGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, isCompact && styles.gradientCompact]}
        >
            <View style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}>
                <Ionicons name={icon} size={isCompact ? 20 : 24} color="white" />
            </View>
            <View style={styles.content}>
                <Text style={[styles.value, isCompact && styles.valueCompact]}>{value}</Text>
                <Text style={[styles.title, isCompact && styles.titleCompact]}>{displayTitle}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </LinearGradient>
    );

    if (onPress) {
        return (
            <TouchableOpacity 
                style={[styles.container, isCompact && styles.containerCompact]} 
                onPress={onPress} 
                activeOpacity={0.8}
            >
                {Content}
            </TouchableOpacity>
        );
    }

    return <View style={[styles.container, isCompact && styles.containerCompact]}>{Content}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minWidth: '48%',
        marginBottom: 12,
    },
    containerCompact: {
        flex: 1,
        minWidth: '30%',
        maxWidth: '32%',
        marginBottom: 8,
    },
    gradient: {
        borderRadius: 16,
        padding: 16,
        minHeight: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientCompact: {
        borderRadius: 12,
        padding: 12,
        minHeight: 85,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainerCompact: {
        width: 32,
        height: 32,
        borderRadius: 8,
        marginBottom: 8,
    },
    content: {
        flex: 1,
    },
    value: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    valueCompact: {
        fontSize: 20,
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    titleCompact: {
        fontSize: 11,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
});
