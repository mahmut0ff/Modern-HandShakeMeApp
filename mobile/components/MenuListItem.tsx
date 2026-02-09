import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MenuListItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    badge?: number;
}

export default function MenuListItem({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    badge
}: MenuListItemProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.tint + '15' }]}>
                <Ionicons name={icon} size={22} color={theme.tint} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.subtitle, { color: theme.text + '66' }]}>{subtitle}</Text>
                )}
            </View>

            {badge !== undefined && badge > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}

            {showChevron && (
                <Ionicons name="chevron-forward" size={20} color={theme.text + '33'} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginRight: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
