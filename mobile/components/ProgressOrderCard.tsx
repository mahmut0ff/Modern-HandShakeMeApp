import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressOrderCardProps {
    title: string;
    masterName?: string;
    progress: number; // 0-100
    status: string;
    dueDate?: string;
    onPress: () => void;
}

export default function ProgressOrderCard({ 
    title, 
    masterName, 
    progress, 
    status, 
    dueDate,
    onPress 
}: ProgressOrderCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getStatusColor = () => {
        if (status === 'IN_PROGRESS') return '#007AFF';
        if (status === 'READY_TO_CONFIRM') return '#34C759';
        return theme.tint;
    };

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: theme.card }]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {progress}%
                    </Text>
                </View>
            </View>

            {masterName && (
                <View style={styles.masterRow}>
                    <Ionicons name="person-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.masterText, { color: theme.text + '66' }]}>
                        {masterName}
                    </Text>
                </View>
            )}

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.text + '10' }]}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { 
                                width: `${progress}%`,
                                backgroundColor: getStatusColor()
                            }
                        ]} 
                    />
                </View>
            </View>

            {dueDate && (
                <View style={styles.footer}>
                    <Ionicons name="time-outline" size={14} color={theme.text + '66'} />
                    <Text style={[styles.dueText, { color: theme.text + '66' }]}>
                        До {dueDate}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    masterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4,
    },
    masterText: {
        fontSize: 13,
    },
    progressContainer: {
        marginBottom: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueText: {
        fontSize: 12,
    },
});
