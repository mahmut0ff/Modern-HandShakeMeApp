import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function MastersScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Masters</Text>
            <Text style={styles.subtitle}>Browse and find experts for your needs.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
