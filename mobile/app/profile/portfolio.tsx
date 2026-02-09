import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PortfolioScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Portfolio</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={24} color={theme.tint} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Ionicons name="briefcase-outline" size={64} color={theme.text + '40'} />
                <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                    No portfolio items yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.text + '40' }]}>
                    Showcase your work to attract more clients
                </Text>
                <TouchableOpacity
                    style={[styles.addPortfolioButton, { backgroundColor: theme.tint }]}
                    onPress={() => {/* TODO: Navigate to add portfolio */ }}
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={styles.addPortfolioText}>Add Portfolio Item</Text>
                </TouchableOpacity>
            </View>
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
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 24,
    },
    addPortfolioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    addPortfolioText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
