import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyChatStateProps {
    avatar?: string;
    name: string;
    theme: any;
}

export default function EmptyChatState({ avatar, name, theme }: EmptyChatStateProps) {
    return (
        <View style={styles.container}>
            {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name="person" size={48} color={theme.tint} />
                </View>
            )}
            <Text style={[styles.name, { color: theme.text }]}>
                {name}
            </Text>
            <Text style={[styles.subtitle, { color: theme.text + '66' }]}>
                Начните общение
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
});
