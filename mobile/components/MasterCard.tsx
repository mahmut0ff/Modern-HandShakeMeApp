import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MasterProfile } from '@/src/api/masters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MasterCardProps {
    master: MasterProfile;
    onPress: (id: string) => void;
    onWrite: (id: string) => void;
    onCreateOrder: (id: string) => void;
}

export default function MasterCard({ master, onPress, onWrite, onCreateOrder }: MasterCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const portfolioImages = master.portfolioPreview || [];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.card, shadowColor: theme.text }]}
            onPress={() => onPress(master.userId)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Image
                    source={master.user?.avatar || 'https://via.placeholder.com/100'}
                    style={styles.avatar}
                />
                <View style={styles.headerInfo}>
                    <Text style={[styles.name, { color: theme.text }]}>
                        {master.firstName} {master.lastName}
                    </Text>
                    <Text style={[styles.specialization, { color: theme.text + '99' }]}>
                        Master Specialist
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={[styles.statText, { color: theme.text }]}>{master.rating}</Text>
                        </View>
                        <Text style={[styles.dot, { color: theme.text + '66' }]}>•</Text>
                        <Text style={[styles.statText, { color: theme.text + '99' }]}>{master.reviewsCount} reviews</Text>
                        <Text style={[styles.dot, { color: theme.text + '66' }]}>•</Text>
                        <Text style={[styles.statText, { color: theme.text + '99' }]}>{master.completedOrders} jobs</Text>
                    </View>
                </View>
            </View>

            {master.bio && (
                <Text style={[styles.bio, { color: theme.text + 'CC' }]} numberOfLines={2}>
                    {master.bio}
                </Text>
            )}

            {portfolioImages.length > 0 && (
                <View style={styles.portfolioContainer}>
                    {portfolioImages.map((img, idx) => (
                        <Image key={idx} source={img} style={styles.portfolioImage} contentFit="cover" />
                    ))}
                    {portfolioImages.length === 0 && (
                        <View style={[styles.noPortfolio, { backgroundColor: theme.background }]}>
                            <Text style={{ color: theme.text + '66' }}>No portfolio yet</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton, { backgroundColor: theme.background }]}
                    onPress={() => onWrite(master.userId)}
                >
                    <Ionicons name="chatbubble-outline" size={18} color={theme.tint} />
                    <Text style={[styles.actionText, { color: theme.tint }]}>Write</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.tint }]}
                    onPress={() => onCreateOrder(master.userId)}
                >
                    <Ionicons name="add-circle-outline" size={18} color="white" />
                    <Text style={[styles.actionText, { color: 'white' }]}>Create Order</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    specialization: {
        fontSize: 14,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        marginLeft: 4,
    },
    dot: {
        marginHorizontal: 6,
    },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    portfolioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    portfolioImage: {
        width: '32%',
        aspectRatio: 1,
        borderRadius: 8,
    },
    noPortfolio: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
