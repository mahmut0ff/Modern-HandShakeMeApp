import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reviewsApi } from '@/src/api/reviews';
import { ordersApi, Order } from '@/src/api/orders';

const REVIEW_TAGS = [
    'Профессионал',
    'Вежливый',
    'Быстро',
    'Качественно',
    'Пунктуальный',
    'Аккуратный',
    'Коммуникабельный',
    'Рекомендую',
];

export default function CreateReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.orderId as string;
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [order, setOrder] = useState<Order | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const response = await ordersApi.getOrder(orderId);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to load order:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить заказ');
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Ошибка', 'Пожалуйста, поставьте оценку');
            return;
        }

        if (comment.trim().length < 10) {
            Alert.alert('Ошибка', 'Отзыв должен содержать минимум 10 символов');
            return;
        }

        setLoading(true);
        try {
            await reviewsApi.createReview({
                orderId,
                rating,
                comment: comment.trim(),
                isAnonymous,
                tags: selectedTags,
            });

            Alert.alert('Успешно', 'Отзыв опубликован', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Failed to create review:', error);
            Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось создать отзыв');
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Оставить отзыв</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order Card */}
                {order && (
                    <View style={[styles.orderCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.orderTitle, { color: theme.text }]}>{order.title}</Text>
                        <Text style={[styles.orderSubtitle, { color: theme.text + '80' }]}>
                            Заказ #{order.id.slice(0, 8)}
                        </Text>
                    </View>
                )}

                {/* Rating */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Оценка *</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={40}
                                    color={star <= rating ? '#FFB800' : theme.text + '40'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={[styles.ratingText, { color: theme.text + '80' }]}>
                            {rating === 5 ? 'Отлично!' : rating === 4 ? 'Хорошо' : rating === 3 ? 'Нормально' : rating === 2 ? 'Плохо' : 'Очень плохо'}
                        </Text>
                    )}
                </View>

                {/* Tags */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Теги (до 3)
                    </Text>
                    <View style={styles.tagsContainer}>
                        {REVIEW_TAGS.map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                onPress={() => toggleTag(tag)}
                                style={[
                                    styles.tag,
                                    {
                                        backgroundColor: selectedTags.includes(tag) ? '#007AFF' : theme.card,
                                        borderColor: selectedTags.includes(tag) ? '#007AFF' : theme.text + '20',
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.tagText,
                                    { color: selectedTags.includes(tag) ? '#FFF' : theme.text }
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comment */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Отзыв * (минимум 10 символов)
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
                        placeholder="Расскажите о вашем опыте работы с мастером..."
                        placeholderTextColor={theme.text + '40'}
                        multiline
                        numberOfLines={6}
                        value={comment}
                        onChangeText={setComment}
                        maxLength={1000}
                    />
                    <Text style={[styles.charCount, { color: theme.text + '60' }]}>
                        {comment.length}/1000
                    </Text>
                </View>

                {/* Anonymous */}
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                >
                    <Ionicons
                        name={isAnonymous ? 'checkbox' : 'square-outline'}
                        size={24}
                        color="#007AFF"
                    />
                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                        Оставить отзыв анонимно
                    </Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { opacity: rating === 0 || comment.trim().length < 10 || loading ? 0.5 : 1 }
                    ]}
                    onPress={handleSubmit}
                    disabled={rating === 0 || comment.trim().length < 10 || loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Отправка...' : 'Опубликовать отзыв'}
                    </Text>
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
    orderCard: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    orderSubtitle: {
        fontSize: 14,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
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
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12,
    },
    checkboxLabel: {
        fontSize: 15,
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
