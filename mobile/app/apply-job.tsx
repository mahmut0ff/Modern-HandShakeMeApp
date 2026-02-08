import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { applicationsApi } from '@/src/api/applications';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ApplyJobScreen() {
    const { id, title, budget } = useLocalSearchParams<{ id: string; title: string; budget: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        coverLetter: '',
        proposedPrice: '',
        proposedDurationDays: '',
    });

    const updateForm = (updates: Partial<typeof form>) => {
        setForm(prev => ({ ...prev, ...updates }));
    };

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = async () => {
        if (form.coverLetter.length < 50) {
            return Alert.alert('Error', 'Cover letter must be at least 50 characters long.');
        }

        const price = parseFloat(form.proposedPrice);
        if (isNaN(price) || price <= 0) {
            return Alert.alert('Error', 'Please enter a valid proposed price.');
        }

        const duration = parseInt(form.proposedDurationDays);
        if (isNaN(duration) || duration <= 0) {
            return Alert.alert('Error', 'Please enter a valid duration in days.');
        }

        setIsLoading(true);
        try {
            await applicationsApi.createApplication({
                orderId: id,
                coverLetter: form.coverLetter,
                proposedPrice: price,
                proposedDurationDays: duration,
            });

            Alert.alert(
                'Success',
                'Your application has been sent successfully!',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/responses') }]
            );
        } catch (error: any) {
            console.error('Failed to send application', error);
            const message = error.response?.data?.error || 'Failed to send application. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Apply for Job</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.jobInfo, { backgroundColor: theme.card }]}>
                        <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={2}>
                            {title || 'Job Application'}
                        </Text>
                        <Text style={[styles.jobBudget, { color: theme.tint }]}>
                            Client's Budget: {budget || 'Negotiable'}
                        </Text>
                    </View>

                    <Text style={[styles.label, { color: theme.text }]}>Cover Letter</Text>
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>
                        Introduce yourself and explain why you're a good fit (min 50 chars).
                    </Text>
                    <TextInput
                        style={[styles.textArea, { color: theme.text, borderColor: theme.text + '20' }] as any}
                        placeholder="I can help you with this job because..."
                        placeholderTextColor={theme.text + '44'}
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        value={form.coverLetter}
                        onChangeText={text => updateForm({ coverLetter: text })}
                    />
                    <Text style={[styles.charCount, { color: form.coverLetter.length < 50 ? '#FF3B30' : '#34C759' }]}>
                        {form.coverLetter.length} / 50 characters required
                    </Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.label, { color: theme.text }]}>My Price ($)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                                keyboardType="numeric"
                                placeholder="50.00"
                                placeholderTextColor={theme.text + '44'}
                                value={form.proposedPrice}
                                onChangeText={text => updateForm({ proposedPrice: text })}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.label, { color: theme.text }]}>Duration (Days)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                                keyboardType="numeric"
                                placeholder="3"
                                placeholderTextColor={theme.text + '44'}
                                value={form.proposedDurationDays}
                                onChangeText={text => updateForm({ proposedDurationDays: text })}
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.text + '10' }]}>
                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.onPrimary} />
                        ) : (
                            <>
                                <Text style={[styles.submitBtnText, { color: theme.onPrimary }]}>Send Application</Text>
                                <Ionicons name="send-outline" size={20} color={theme.onPrimary} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 15,
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
        textAlign: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    jobInfo: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    jobBudget: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    hint: {
        fontSize: 13,
        marginBottom: 10,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        minHeight: 150,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingTop: 15,
        fontSize: 16,
        marginBottom: 5,
    },
    charCount: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    submitBtn: {
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
});
