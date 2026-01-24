import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../../constants/Colors';

export interface DocumentUploaderProps {
  onImageSelected: (uri: string, type: 'image' | 'document') => void;
  allowDocuments?: boolean;
  maxSizeMB?: number;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onImageSelected,
  allowDocuments = true,
  maxSizeMB = 10,
}) => {
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size
        if (file.size && file.size > maxSizeMB * 1024 * 1024) {
          Alert.alert('File Too Large', `File size must be less than ${maxSizeMB}MB`);
          return;
        }

        onImageSelected(file.uri, 'document');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const showUploadOptions = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
    ];

    if (allowDocuments) {
      options.push({ text: 'Upload Document', onPress: pickDocument });
    }

    Alert.alert('Upload Document', 'Choose upload method', options);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadArea} onPress={showUploadOptions}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.description}>
          Take a photo, choose from gallery, or upload a document
        </Text>
        <Text style={styles.hint}>
          Max size: {maxSizeMB}MB • Formats: JPG, PNG, PDF
        </Text>
      </TouchableOpacity>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color={Colors.primary} />
          <Text style={styles.quickButtonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color={Colors.primary} />
          <Text style={styles.quickButtonText}>Gallery</Text>
        </TouchableOpacity>

        {allowDocuments && (
          <TouchableOpacity style={styles.quickButton} onPress={pickDocument}>
            <Ionicons name="document" size={24} color={Colors.primary} />
            <Text style={styles.quickButtonText}>Document</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blue[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
});
