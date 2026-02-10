import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reviewsApi } from '@/src/api/reviews';

export default function RespondToReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const reviewId = params.id as string;
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (response.trim().length < 10) {
            Alert.alert('Ошибка', 'Ответ должен содержать минимум 10 символов');
            return;
        }

        setLoading(true);
        try {
            await reviewsApi.respondToReview(reviewId, response.trim());

            Alert.alert('Успешно', 'Ответ опубликован', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Failed to respond to review:', error);
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось отправить ответ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Ответить на отзыв</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={[styles.infoText, { color: theme.text + '80' }]}>
                        Ваш ответ будет виден всем пользователям. Будьте вежливы и профессиональны.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Ваш ответ * (минимум 10 символов)
                    </Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: theme.card,
                                color: theme.text,
                                borderColor: theme.text + '20',
                            }
                        ]}
                        placeholder="Напишите ваш ответ..."
                        placeholderTextColor={theme.text + '40'}
                        multiline
                        numberOfLines={6}
                        value={response}
                        onChangeText={setResponse}
                        maxLength={1000}
                    />
                    <Text style={[styles.charCount, { color: theme.text + '60' }]}>
                        {response.length}/1000
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { opacity: response.trim().length < 10 || loading ? 0.5 : 1 }
                    ]}
                    onPress={handleSubmit}
                    disabled={response.trim().length < 10 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Опубликовать ответ</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
        minHeight: 120,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        marginHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
