import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image as RNImage,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { portfolioApi, PortfolioItem } from '@/src/api/portfolio';
import { categoriesApi, Category } from '@/src/api/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AddPortfolioScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ itemId?: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const isEditMode = !!params.itemId;

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [cost, setCost] = useState('');
    const [durationDays, setDurationDays] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [clientReview, setClientReview] = useState('');
    const [clientRating, setClientRating] = useState<number>(0);

    useEffect(() => {
        loadCategories();
        if (isEditMode) {
            loadPortfolioItem();
        }
    }, []);

    const loadCategories = async () => {
        try {
            const response = await categoriesApi.listCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const loadPortfolioItem = async () => {
        try {
            const response = await portfolioApi.getPortfolioItem(params.itemId!);
            const item = response.data;
            setTitle(item.title);
            setDescription(item.description);
            setImages(item.images);
            setSkills(item.skills);
            setCost(item.cost?.toString() || '');
            setDurationDays(item.durationDays?.toString() || '');
            setSelectedCategory(item.category?.id ? parseInt(item.category.id) : null);
            setIsPublic(item.isPublic);
            setClientReview(item.clientReview || '');
            setClientRating(item.clientRating || 0);
        } catch (error) {
            console.error('Failed to load portfolio item', error);
            Alert.alert('Ошибка', 'Не удалось загрузить элемент портфолио');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        if (images.length >= 10) {
            Alert.alert('Лимит', 'Максимум 10 изображений');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Разрешение', 'Нужно разрешение для доступа к галерее');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            quality: 0.8,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            
            // For now, use the local URI directly
            // In production, you would upload to S3 and get the URL
            // TODO: Implement proper image upload to S3
            setImages(prev => [...prev, imageUri]);
            
            // Show info that images will be uploaded on save
            if (images.length === 0) {
                Alert.alert(
                    'Информация',
                    'Изображения будут загружены при сохранении работы',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const addSkill = () => {
        const trimmedSkill = skillInput.trim();
        if (!trimmedSkill) return;
        
        if (skills.length >= 20) {
            Alert.alert('Лимит', 'Максимум 20 навыков');
            return;
        }

        if (skills.includes(trimmedSkill)) {
            Alert.alert('Дубликат', 'Этот навык уже добавлен');
            return;
        }

        setSkills(prev => [...prev, trimmedSkill]);
        setSkillInput('');
    };

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill));
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            Alert.alert('Ошибка', 'Введите название');
            return false;
        }
        if (title.length < 3) {
            Alert.alert('Ошибка', 'Название должно быть минимум 3 символа');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Ошибка', 'Введите описание');
            return false;
        }
        if (description.length < 10) {
            Alert.alert('Ошибка', 'Описание должно быть минимум 10 символов');
            return false;
        }
        if (images.length === 0) {
            Alert.alert('Ошибка', 'Добавьте хотя бы одно изображение');
            return false;
        }
        if (clientRating > 0 && !clientReview.trim()) {
            Alert.alert('Ошибка', 'Добавьте отзыв клиента при указании рейтинга');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            // Upload local images first
            const uploadedImages: string[] = [];
            for (const imageUri of images) {
                if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
                    // This is a local file, need to upload
                    // For now, use placeholder URL
                    // TODO: Implement proper S3 upload
                    const placeholderUrl = `https://via.placeholder.com/600x600.png?text=Portfolio+Image`;
                    uploadedImages.push(placeholderUrl);
                    console.warn('Using placeholder for local image:', imageUri);
                } else {
                    // Already a URL
                    uploadedImages.push(imageUri);
                }
            }

            const data = {
                title: title.trim(),
                description: description.trim(),
                images: uploadedImages,
                skills,
                cost: cost ? parseFloat(cost) : undefined,
                durationDays: durationDays ? parseInt(durationDays) : undefined,
                categoryId: selectedCategory?.toString(),
                clientReview: clientReview.trim() || undefined,
                clientRating: clientRating > 0 ? clientRating : undefined,
                isPublic,
            };

            if (isEditMode) {
                await portfolioApi.updatePortfolioItem(params.itemId!, data);
                Alert.alert('Успех', 'Портфолио обновлено');
            } else {
                await portfolioApi.createPortfolioItem(data);
                Alert.alert('Успех', 'Работа добавлена в портфолио');
            }
            router.back();
        } catch (error: any) {
            console.error('Failed to save portfolio item', error);
            const errorMessage = error.response?.data?.error || error.message || 'Не удалось сохранить';
            Alert.alert('Ошибка', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card, paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Загрузка...</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {isEditMode ? 'Редактировать' : 'Добавить работу'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                        <Text style={[styles.saveButton, { color: theme.tint }]}>Сохранить</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Images */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>
                        Изображения <Text style={{ color: '#ff3b30' }}>*</Text>
                    </Text>
                    <View style={[styles.infoBox, { backgroundColor: theme.tint + '10', borderColor: theme.tint + '30' }]}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.tint} />
                        <Text style={[styles.infoText, { color: theme.tint }]}>
                            Временно: изображения будут заменены на placeholder при сохранении. Загрузка в S3 будет добавлена позже.
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageContainer}>
                                <RNImage source={{ uri }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#ff3b30" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 10 && (
                            <TouchableOpacity
                                style={[styles.addImageButton, { backgroundColor: theme.card, borderColor: theme.text + '20' }]}
                                onPress={pickImage}
                            >
                                <Ionicons name="add" size={32} color={theme.text + '66'} />
                                <Text style={[styles.addImageText, { color: theme.text + '66' }]}>
                                    Добавить
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>
                        {images.length}/10 изображений
                    </Text>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>
                        Название <Text style={{ color: '#ff3b30' }}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                        placeholder="Например: Ремонт квартиры 50м²"
                        placeholderTextColor={theme.text + '66'}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={200}
                    />
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>{title.length}/200</Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>
                        Описание <Text style={{ color: '#ff3b30' }}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                        placeholder="Опишите выполненную работу, использованные материалы и технологии..."
                        placeholderTextColor={theme.text + '66'}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                        maxLength={1000}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>{description.length}/1000</Text>
                </View>

                {/* Skills */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Навыки</Text>
                    <View style={styles.skillInputContainer}>
                        <TextInput
                            style={[styles.skillInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            placeholder="Добавить навык"
                            placeholderTextColor={theme.text + '66'}
                            value={skillInput}
                            onChangeText={setSkillInput}
                            onSubmitEditing={addSkill}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.addSkillButton, { backgroundColor: theme.tint }]}
                            onPress={addSkill}
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.skillsContainer}>
                        {skills.map((skill, index) => (
                            <View key={index} style={[styles.skillChip, { backgroundColor: theme.tint + '20' }]}>
                                <Text style={[styles.skillChipText, { color: theme.tint }]}>{skill}</Text>
                                <TouchableOpacity onPress={() => removeSkill(skill)}>
                                    <Ionicons name="close" size={16} color={theme.tint} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>{skills.length}/20 навыков</Text>
                </View>

                {/* Category */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Категория</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                { backgroundColor: selectedCategory === null ? theme.tint : theme.card }
                            ]}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                { color: selectedCategory === null ? 'white' : theme.text }
                            ]}>Не выбрано</Text>
                        </TouchableOpacity>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    { backgroundColor: selectedCategory === cat.id ? theme.tint : theme.card }
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    { color: selectedCategory === cat.id ? 'white' : theme.text }
                                ]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Cost and Duration */}
                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: theme.text }]}>Стоимость ($)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            placeholder="0"
                            placeholderTextColor={theme.text + '66'}
                            value={cost}
                            onChangeText={setCost}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={[styles.label, { color: theme.text }]}>Длительность (дни)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            placeholder="0"
                            placeholderTextColor={theme.text + '66'}
                            value={durationDays}
                            onChangeText={setDurationDays}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Client Review */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Отзыв клиента</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                        placeholder="Отзыв клиента о выполненной работе..."
                        placeholderTextColor={theme.text + '66'}
                        value={clientReview}
                        onChangeText={setClientReview}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.hint, { color: theme.text + '66' }]}>{clientReview.length}/500</Text>
                </View>

                {/* Client Rating */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.text }]}>Рейтинг клиента</Text>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setClientRating(star)}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={star <= clientRating ? 'star' : 'star-outline'}
                                    size={32}
                                    color={star <= clientRating ? '#FFD700' : theme.text + '40'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Public/Private */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setIsPublic(!isPublic)}
                    >
                        <View style={[
                            styles.checkbox,
                            {
                                backgroundColor: isPublic ? theme.tint : 'transparent',
                                borderColor: isPublic ? theme.tint : theme.text + '40'
                            }
                        ]}>
                            {isPublic && (
                                <Ionicons name="checkmark" size={18} color="white" />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                                Публичное портфолио
                            </Text>
                            <Text style={[styles.checkboxHint, { color: theme.text + '66' }]}>
                                Другие пользователи смогут видеть эту работу в вашем профиле
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        minHeight: 120,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    imagesScroll: {
        marginBottom: 8,
    },
    imageContainer: {
        width: 120,
        height: 120,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    addImageButton: {
        width: 120,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageText: {
        fontSize: 12,
        marginTop: 4,
    },
    skillInputContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    skillInput: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    addSkillButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    skillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    skillChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    checkboxHint: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
});
