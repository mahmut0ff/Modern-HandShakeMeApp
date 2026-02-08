import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ordersApi, CreateOrderRequest } from '@/src/api/orders';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = [
    { id: '1', name: 'Renovation', icon: 'hammer-outline' },
    { id: '2', name: 'Cleaning', icon: 'sparkles-outline' },
    { id: '3', name: 'Delivery', icon: 'bicycle-outline' },
    { id: '4', name: 'IT & Design', icon: 'laptop-outline' },
    { id: '5', name: 'Beauty', icon: 'cut-outline' },
    { id: '6', name: 'Events', icon: 'calendar-outline' },
];

export default function CreateJobScreen() {
    const { id, data, masterId } = useLocalSearchParams<{ id?: string; data?: string; masterId?: string }>();
    const isEditing = !!id;
    const initialData = data ? JSON.parse(data) : null;

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [form, setForm] = useState<CreateOrderRequest>(initialData || {
        title: '',
        description: '',
        categoryId: '',
        subcategory: '',
        city: 'Bishkek',
        address: '',
        budgetType: 'NEGOTIABLE',
        isUrgent: false,
        workVolume: '',
        floor: 0,
        hasElevator: false,
        materialStatus: 'NOT_REQUIRED',
        hasElectricity: false,
        hasWater: false,
        canStoreTools: false,
        hasParking: false,
        requiredExperience: 'ANY',
        needTeam: false,
        additionalRequirements: '',
        images: [],
    });

    const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const updateForm = (updates: Partial<CreateOrderRequest>) => {
        setForm(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (step === 1) {
            if (form.title.length < 5) return Alert.alert('Error', 'Title must be at least 5 characters');
            if (form.description.length < 20) return Alert.alert('Error', 'Description must be at least 20 characters');
        }
        if (step === 2) {
            if (!form.categoryId) return Alert.alert('Error', 'Please select a category');
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step === 1) router.back();
        else setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            let orderId = id;
            if (isEditing && id) {
                await ordersApi.updateOrder(id, form);
            } else if (masterId) {
                const response = await ordersApi.createDirectOrder({ ...form, masterId });
                orderId = response.data.id;
            } else {
                const response = await ordersApi.createOrder(form);
                orderId = response.data.id;
            }

            // Upload images if any
            if (orderId && selectedImages.length > 0) {
                for (const img of selectedImages) {
                    const formData = new FormData();
                    // @ts-ignore
                    formData.append('file', {
                        uri: img.uri,
                        name: img.fileName || 'photo.jpg',
                        type: img.mimeType || 'image/jpeg',
                    });
                    await ordersApi.uploadOrderFile(orderId, formData);
                }
            }

            Alert.alert('Success', `Job ${isEditing ? 'updated' : masterId ? 'assigned' : 'posted'} successfully!`, [
                { text: 'OK', onPress: () => router.replace('/(tabs)/my-jobs') }
            ]);
        } catch (error) {
            console.error('Failed to save job', error);
            Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'post'} job. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>Basic Information</Text>
                        <Text style={[styles.label, { color: theme.text }]}>What needs to be done?</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            placeholder="e.g. Need a master to fix a tap"
                            placeholderTextColor={theme.text + '66'}
                            value={form.title}
                            onChangeText={text => updateForm({ title: text })}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>Detailed Description</Text>
                        <TextInput
                            style={[styles.textArea, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            placeholder="Describe your job in detail..."
                            placeholderTextColor={theme.text + '66'}
                            multiline
                            numberOfLines={6}
                            value={form.description}
                            onChangeText={text => updateForm({ description: text })}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryItem,
                                        { borderColor: theme.text + '10' },
                                        form.categoryId === cat.id && { borderColor: theme.tint, backgroundColor: theme.tint + '10' }
                                    ] as any}
                                    onPress={() => updateForm({ categoryId: cat.id })}
                                >
                                    <View style={styles.catIconContainer}>
                                        <Ionicons name={cat.icon as any} size={24} color={form.categoryId === cat.id ? theme.tint : theme.text + '99'} />
                                    </View>
                                    <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>Subcategory (Optional)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            placeholder="e.g. Plumbing -> Tap repair"
                            placeholderTextColor={theme.text + '66'}
                            value={form.subcategory}
                            onChangeText={text => updateForm({ subcategory: text })}
                        />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>Budget & Volume</Text>
                        <Text style={[styles.label, { color: theme.text }]}>Budget Type</Text>
                        <View style={styles.row}>
                            {(['NEGOTIABLE', 'FIXED', 'RANGE'] as const).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeBtn,
                                        { backgroundColor: theme.text + '05' },
                                        form.budgetType === type && { backgroundColor: theme.primary }
                                    ] as any}
                                    onPress={() => updateForm({ budgetType: type })}
                                >
                                    <Text style={[styles.typeBtnText, { color: form.budgetType === type ? theme.onPrimary : theme.text }]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {form.budgetType !== 'NEGOTIABLE' && (
                            <View style={[styles.row, { marginTop: 15 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: theme.text }]}>Min Budget</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                                        keyboardType="numeric"
                                        value={form.budgetMin?.toString()}
                                        onChangeText={text => updateForm({ budgetMin: parseInt(text) || 0 })}
                                    />
                                </View>
                                {form.budgetType === 'RANGE' && (
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.label, { color: theme.text }]}>Max Budget</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                                            keyboardType="numeric"
                                            value={form.budgetMax?.toString()}
                                            onChangeText={text => updateForm({ budgetMax: parseInt(text) || 0 })}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Work Volume (e.g. 50 m², 2 hours)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            placeholder="e.g. 2 rooms, approx 40m²"
                            placeholderTextColor={theme.text + '66'}
                            value={form.workVolume}
                            onChangeText={text => updateForm({ workVolume: text })}
                        />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>Site Details</Text>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.text }]}>Floor</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                                    keyboardType="numeric"
                                    value={form.floor?.toString()}
                                    onChangeText={text => updateForm({ floor: parseInt(text) || 0 })}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.switchCard, { flex: 1, marginLeft: 15 }]}
                                onPress={() => updateForm({ hasElevator: !form.hasElevator })}
                            >
                                <Ionicons name={form.hasElevator ? "business" : "business-outline"} size={20} color={form.hasElevator ? theme.tint : theme.text + '66'} />
                                <Text style={[styles.switchLabel, { color: theme.text }]}>Elevator</Text>
                                <Ionicons name={form.hasElevator ? "checkbox" : "square-outline"} size={24} color={form.hasElevator ? theme.tint : theme.text + '20'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.switchGrid}>
                            {[
                                { key: 'hasElectricity', label: 'Electricity', icon: 'flash' },
                                { key: 'hasWater', label: 'Water', icon: 'water' },
                                { key: 'canStoreTools', label: 'Storage', icon: 'construct' },
                                { key: 'hasParking', label: 'Parking', icon: 'car' },
                                { key: 'needTeam', label: 'Team', icon: 'people' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.switchCard, (form as any)[item.key] && { backgroundColor: theme.tint + '05', borderColor: theme.tint + '30' }]}
                                    onPress={() => updateForm({ [item.key]: !(form as any)[item.key] })}
                                >
                                    <Ionicons name={item.icon as any} size={20} color={(form as any)[item.key] ? theme.tint : theme.text + '66'} />
                                    <Text style={[styles.switchLabel, { color: theme.text }]}>{item.label}</Text>
                                    <Ionicons name={(form as any)[item.key] ? "checkbox" : "square-outline"} size={22} color={(form as any)[item.key] ? theme.tint : theme.text + '20'} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>Required Experience</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            placeholder="e.g. At least 3 years"
                            placeholderTextColor={theme.text + '66'}
                            value={form.requiredExperience}
                            onChangeText={text => updateForm({ requiredExperience: text })}
                        />
                    </View>
                );
            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>Location & Final Details</Text>
                        <Text style={[styles.label, { color: theme.text }]}>City</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            value={form.city}
                            onChangeText={text => updateForm({ city: text })}
                        />
                        <Text style={[styles.label, { color: theme.text }]}>Address (Optional)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.text + '20' }] as any}
                            value={form.address}
                            onChangeText={text => updateForm({ address: text })}
                        />

                        <TouchableOpacity
                            style={styles.urgentRow}
                            onPress={() => updateForm({ isUrgent: !form.isUrgent })}
                        >
                            <View style={[styles.checkbox, form.isUrgent && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}>
                                {form.isUrgent && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={[styles.urgentLabel, { color: theme.text }]}>Mark as URGENT</Text>
                        </TouchableOpacity>

                        <Text style={[styles.label, { color: theme.text }]}>Additional Requirements</Text>
                        <TextInput
                            style={[styles.textArea, { color: theme.text, borderColor: theme.text + '20', minHeight: 80 }] as any}
                            placeholder="Any other details..."
                            placeholderTextColor={theme.text + '66'}
                            multiline
                            value={form.additionalRequirements}
                            onChangeText={text => updateForm({ additionalRequirements: text })}
                        />
                    </View>
                );
            case 5:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>Photos</Text>
                        <Text style={[styles.label, { color: theme.text }]}>Add photos of the workspace or issues (Max 10)</Text>

                        <View style={styles.imageGrid}>
                            <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: theme.text + '20' }]} onPress={pickImages}>
                                <Ionicons name="camera-outline" size={32} color={theme.text + '66'} />
                                <Text style={[styles.addPhotoText, { color: theme.text + '66' }]}>Add Photos</Text>
                            </TouchableOpacity>

                            {selectedImages.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <View style={[styles.imagePlaceholder, { backgroundColor: theme.text + '05' }]}>
                                        <Ionicons name="image-outline" size={24} color={theme.text + '33'} />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeImageBtn}
                                        onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.summary, { backgroundColor: theme.text + '05', marginTop: 30 }]}>
                            <Text style={[styles.summaryTitle, { color: theme.text }]}>Summary</Text>
                            <Text style={[styles.summaryText, { color: theme.text + '99' }]}>Title: {form.title}</Text>
                            <Text style={[styles.summaryText, { color: theme.text + '99' }]}>Budget: {form.budgetType} {form.budgetMin ? `($${form.budgetMin})` : ''}</Text>
                            <Text style={[styles.summaryText, { color: theme.text + '99' }]}>Location: {form.city}</Text>
                            <Text style={[styles.summaryText, { color: theme.text + '99' }]}>Photos: {selectedImages.length} selected</Text>
                        </View>
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.text + '10' }]}>
                        <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` as any, backgroundColor: theme.primary }]} />
                    </View>
                    <Text style={[styles.stepIndicator, { color: theme.text + '66' }]}>Step {step} of 5</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderStepContent()}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: (theme.text + '10') as any }]}>
                {step < 5 ? (
                    <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={handleNext}>
                        <Text style={[styles.nextBtnText, { color: theme.onPrimary }]}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color={theme.onPrimary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: '#34C759' }]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={[styles.nextBtnText, { color: '#fff' }]}>Post Job</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
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
    progressContainer: {
        flex: 1,
        alignItems: 'center',
    },
    progressBar: {
        width: '80%',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    stepIndicator: {
        fontSize: 12,
        marginTop: 5,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
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
        minHeight: 120,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingTop: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    categoryItem: {
        width: '30%',
        margin: '1.5%',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catIconContainer: {
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
    },
    typeBtn: {
        flex: 1,
        height: 45,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    urgentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    urgentLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    summary: {
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 14,
        marginBottom: 5,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    nextBtn: {
        height: 55,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    switchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    switchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 10,
        width: '100%',
        justifyContent: 'space-between',
    },
    switchLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    addPhotoBtn: {
        width: '30%',
        aspectRatio: 1,
        margin: '1.5%',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoText: {
        fontSize: 10,
        marginTop: 5,
        fontWeight: '600',
    },
    imageWrapper: {
        width: '30%',
        aspectRatio: 1,
        margin: '1.5%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 1,
    },
});
