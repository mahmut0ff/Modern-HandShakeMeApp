import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi } from '@/src/api/orders';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Header, Card, Button } from '@/components/ui';

export default function ReviewScreen() {
    const { id, masterId, title } = useLocalSearchParams<{ id: string, masterId: string, title: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!id) return;
        setIsSubmitting(true);
        try {
            await ordersApi.confirmCompletion(id, rating, comment, isAnonymous);
            Alert.alert('Success', 'The job has been completed and your review was submitted.');
            router.dismissAll();
            router.push('/(tabs)/my-jobs');
        } catch (error) {
            console.error('Failed to submit review', error);
            Alert.alert('Error', 'Failed to confirm completion. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Review & Complete</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.text + '66' }]}>
                    Please rate the master's work and leave a review to complete the order.
                </Text>

                <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            style={styles.starBox}
                        >
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={40}
                                color={star <= rating ? "#FFCC00" : theme.text + '20'}
                            />
                        </TouchableOpacity>
                    ))}
                    <Text style={[styles.ratingLabel, { color: theme.text }]}>
                        {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Comment (Optional)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '10' }]}
                        placeholder="Tell others about your experience..."
                        placeholderTextColor={theme.text + '40'}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>

                <TouchableOpacity
                    style={styles.anonRow}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isAnonymous ? "checkbox" : "square-outline"}
                        size={20}
                        color={isAnonymous ? theme.tint : theme.text + '33'}
                    />
                    <Text style={[styles.anonText, { color: theme.text }]}>Post review anonymously</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={theme.onPrimary} />
                    ) : (
                        <Text style={[styles.submitBtnText, { color: theme.onPrimary }]}>Complete & Submit</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    jobTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 30,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    starBox: {
        padding: 8,
    },
    ratingLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderRadius: 12,
        padding: 15,
        height: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    anonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    anonText: {
        marginLeft: 10,
        fontSize: 14,
    },
    submitBtn: {
        height: 55,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
