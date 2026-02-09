import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScrollToBottomButtonProps {
    onPress: () => void;
    theme: any;
}

export default function ScrollToBottomButton({ onPress, theme }: ScrollToBottomButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.tint }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
            <Text style={styles.text}>Новые сообщения</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});
