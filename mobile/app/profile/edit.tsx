import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi, UpdateUserRequest, UpdateMasterProfileRequest, MasterProfile } from '@/src/api/profile';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function EditProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const isMaster = user?.role === 'MASTER';

    // Basic fields
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [city, setCity] = useState(user?.city || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');

    // Master-specific fields
    const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [bio, setBio] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [dailyRate, setDailyRate] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');
    const [maxOrderAmount, setMaxOrderAmount] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isLoading, setIsLoading] = useState(isMaster);

    // Load master profile if user is a master
    useEffect(() => {
        if (isMaster) {
            loadMasterProfile();
        }
    }, [isMaster]);

    const loadMasterProfile = async () => {
        try {
            const response = await profileApi.getMasterProfile();
            const profile = response.data;
            setMasterProfile(profile);
            
            // Populate fields
            setCompanyName(profile.companyName || '');
            setBio(profile.bio || '');
            setExperienceYears(profile.experienceYears?.toString() || '');
            setHourlyRate(profile.hourlyRate || '');
            setDailyRate(profile.dailyRate || '');
            setMinOrderAmount(profile.minOrderAmount || '');
            setMaxOrderAmount(profile.maxOrderAmount || '');
        } catch (error) {
            console.error('Failed to load master profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setIsUploadingAvatar(true);
            try {
                const response = await profileApi.uploadAvatar(result.assets[0].uri);
                setAvatar(response.data.avatar);
                Alert.alert('Success', 'Avatar updated successfully');
            } catch (error) {
                console.error('Failed to upload avatar', error);
                Alert.alert('Error', 'Failed to upload avatar. Please try again.');
            } finally {
                setIsUploadingAvatar(false);
            }
        }
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (isMaster && !city.trim()) {
            Alert.alert('Error', 'City is required for masters');
            return;
        }

        setIsSaving(true);
        try {
            // Update basic user info
            const userData: UpdateUserRequest = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                city: city.trim() || undefined,
            };

            await profileApi.updateCurrentUser(userData);

            // Update master profile if user is a master
            if (isMaster) {
                const masterData: UpdateMasterProfileRequest = {
                    companyName: companyName.trim() || undefined,
                    bio: bio.trim() || undefined,
                    experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
                    hourlyRate: hourlyRate.trim() || undefined,
                    dailyRate: dailyRate.trim() || undefined,
                    minOrderAmount: minOrderAmount.trim() || undefined,
                    maxOrderAmount: maxOrderAmount.trim() || undefined,
                    city: city.trim(),
                };

                await profileApi.updateMasterProfile(masterData);
            }

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Failed to update profile', error);
            const errorMessage = error?.response?.data?.message || 'Failed to update profile. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10', paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                    <View style={styles.saveButton} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10', paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                        <Text style={[styles.saveButtonText, { color: theme.tint }]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handlePickImage}
                        disabled={isUploadingAvatar}
                    >
                        {avatar ? (
                            <Image
                                source={{ uri: avatar }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={[theme.tint + '40', theme.tint + '20']}
                                style={styles.avatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="person" size={48} color={theme.tint} />
                            </LinearGradient>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.tint }]}>
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="camera" size={20} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.avatarHint, { color: theme.text + '66' }]}>
                        Tap to change photo
                    </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    {/* Basic Information */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            First Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Введите имя"
                            placeholderTextColor={theme.text + '40'}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Last Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Введите фамилию"
                            placeholderTextColor={theme.text + '40'}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            City {isMaster && <Text style={styles.required}>*</Text>}
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            value={city}
                            onChangeText={setCity}
                            placeholder="Введите город"
                            placeholderTextColor={theme.text + '40'}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
                        <View style={[styles.disabledInputContainer, { backgroundColor: theme.text + '05', borderColor: theme.text + '10' }]}>
                            <Text style={[styles.disabledInput, { color: theme.text + '50' }]}>
                                {user?.phone}
                            </Text>
                            <Ionicons name="lock-closed-outline" size={16} color={theme.text + '40'} />
                        </View>
                        <Text style={[styles.hint, { color: theme.text + '50' }]}>
                            Phone number cannot be changed
                        </Text>
                    </View>

                    {/* Master-specific fields */}
                    {isMaster && (
                        <>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
                                Professional Information
                            </Text>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Company Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    placeholder="Введите название компании"
                                    placeholderTextColor={theme.text + '40'}
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Расскажите о себе и своем опыте"
                                    placeholderTextColor={theme.text + '40'}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Experience (years)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={experienceYears}
                                    onChangeText={setExperienceYears}
                                    placeholder="Например: 5"
                                    placeholderTextColor={theme.text + '40'}
                                    keyboardType="numeric"
                                />
                            </View>

                            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
                                Pricing
                            </Text>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Hourly Rate</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={hourlyRate}
                                    onChangeText={setHourlyRate}
                                    placeholder="Например: 1000"
                                    placeholderTextColor={theme.text + '40'}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Daily Rate</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={dailyRate}
                                    onChangeText={setDailyRate}
                                    placeholder="Например: 8000"
                                    placeholderTextColor={theme.text + '40'}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Min Order Amount</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={minOrderAmount}
                                    onChangeText={setMinOrderAmount}
                                    placeholder="Например: 5000"
                                    placeholderTextColor={theme.text + '40'}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { color: theme.text }]}>Max Order Amount</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                                    value={maxOrderAmount}
                                    onChangeText={setMaxOrderAmount}
                                    placeholder="Например: 100000"
                                    placeholderTextColor={theme.text + '40'}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.infoBox, { backgroundColor: theme.tint + '10', borderColor: theme.tint + '30' }]}>
                                <Ionicons name="information-circle-outline" size={20} color={theme.tint} />
                                <Text style={[styles.infoText, { color: theme.text }]}>
                                    To edit your skills and categories, please go to Portfolio section
                                </Text>
                            </View>
                        </>
                    )}
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
        paddingHorizontal: 16,
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
    saveButton: {
        minWidth: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarHint: {
        fontSize: 14,
        marginTop: 12,
    },
    form: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#ff3b30',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    disabledInputContainer: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    disabledInput: {
        fontSize: 16,
        flex: 1,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        fontStyle: 'italic',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 16,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
