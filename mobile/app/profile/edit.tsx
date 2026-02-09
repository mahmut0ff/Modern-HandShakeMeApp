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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi, UpdateUserRequest } from '@/src/api/profile';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function EditProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [city, setCity] = useState(user?.city || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

        setIsSaving(true);
        try {
            const data: UpdateUserRequest = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                city: city.trim() || undefined,
            };

            await profileApi.updateCurrentUser(data);
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.text + '10' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                        <Text style={[styles.saveButton, { color: theme.tint }]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handlePickImage}
                        disabled={isUploadingAvatar}
                    >
                        <Image
                            source={avatar || 'https://via.placeholder.com/120'}
                            style={styles.avatar}
                        />
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
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            First Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter first name"
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
                            placeholder="Enter last name"
                            placeholderTextColor={theme.text + '40'}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>City</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text + '20' }]}
                            value={city}
                            onChangeText={setCity}
                            placeholder="Enter city"
                            placeholderTextColor={theme.text + '40'}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card + '50', color: theme.text + '66', borderColor: theme.text + '20' }]}
                            value={user?.phone}
                            editable={false}
                        />
                        <Text style={[styles.hint, { color: theme.text + '66' }]}>
                            Phone number cannot be changed
                        </Text>
                    </View>
                </View>
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
    saveButton: {
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
    field: {
        marginBottom: 24,
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
    hint: {
        fontSize: 12,
        marginTop: 4,
    },
});
