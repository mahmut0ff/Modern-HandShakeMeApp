import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { verificationApi, VerificationStatus } from '@/src/api/verification';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VerificationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(null);
  const [passportPhotoUri, setPassportPhotoUri] = useState<string | null>(null);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await verificationApi.getStatus();
      setVerification(response.data);

      const facePhoto = response.data.documents.find(doc => doc.type === 'face_photo');
      const passportPhoto = response.data.documents.find(doc => doc.type === 'passport_photo');

      if (facePhoto) setFacePhotoUri(facePhoto.url);
      if (passportPhoto) setPassportPhotoUri(passportPhoto.url);
    } catch (error: any) {
      console.error('Failed to fetch verification status', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (type: 'face' | 'passport') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'face' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(type, result.assets[0].uri);
    }
  };

  const takePhoto = async (type: 'face' | 'passport') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'face' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(type, result.assets[0].uri);
    }
  };

  const uploadPhoto = async (type: 'face' | 'passport', uri: string) => {
    try {
      if (type === 'face') setUploadingFace(true);
      else setUploadingPassport(true);

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `${type}_photo.jpg`,
      } as any);

      const response = type === 'face'
        ? await verificationApi.uploadFacePhoto(formData)
        : await verificationApi.uploadPassportPhoto(formData);

      if (type === 'face') setFacePhotoUri(uri);
      else setPassportPhotoUri(uri);

      Alert.alert('Success', response.data.message);
      fetchVerificationStatus();
    } catch (error: any) {
      console.error(`Failed to upload ${type} photo`, error);
      Alert.alert('Error', error.response?.data?.error?.message || `Failed to upload photo`);
    } finally {
      if (type === 'face') setUploadingFace(false);
      else setUploadingPassport(false);
    }
  };

  const submitVerification = async () => {
    if (!facePhotoUri || !passportPhotoUri) {
      Alert.alert('Missing Photos', 'Please upload both photos');
      return;
    }

    Alert.alert(
      'Submit Verification',
      'Submit for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await verificationApi.submitForReview();
              Alert.alert('Success', response.data.message);
              fetchVerificationStatus();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error?.message || 'Failed to submit');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const showPhotoOptions = (type: 'face' | 'passport') => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return '#9E9E9E';
      case 'pending': return '#FF9800';
      case 'in_review': return '#2196F3';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'pending': return 'Pending Review';
      case 'in_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const status = verification?.status || 'not_started';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending' || status === 'in_review';
  const canUpload = !isApproved && !isPending;
  const canSubmit = canUpload && facePhotoUri && passportPhotoUri;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <LinearGradient
        colors={[getStatusColor(status), getStatusColor(status) + 'DD']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {isApproved && (
          <View style={[styles.resultCard, { backgroundColor: '#4CAF50' + '15', borderColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={[styles.resultTitle, { color: '#4CAF50' }]}>Verification Approved!</Text>
            <Text style={[styles.resultText, { color: theme.text }]}>
              Your identity has been verified. You now have a verified badge.
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.resultCard, { backgroundColor: '#F44336' + '15', borderColor: '#F44336' }]}>
            <Ionicons name="close-circle" size={48} color="#F44336" />
            <Text style={[styles.resultTitle, { color: '#F44336' }]}>Verification Rejected</Text>
            {verification?.rejection_reason && (
              <Text style={[styles.resultText, { color: theme.text }]}>
                Reason: {verification.rejection_reason}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: '#F44336' }]}
              onPress={() => fetchVerificationStatus()}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Retry Verification</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPending && (
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="time-outline" size={32} color="#FF9800" />
            <Text style={[styles.infoTitle, { color: theme.text }]}>Under Review</Text>
            <Text style={[styles.infoText, { color: theme.text + '99' }]}>
              Your verification is being reviewed. You'll be notified once complete.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Requirements</Text>
          <View style={[styles.requirementCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={20} color={theme.tint} />
            <Text style={[styles.requirementText, { color: theme.text }]}>
              • Face clearly visible{'\n'}
              • Good lighting{'\n'}
              • No mask or sunglasses{'\n'}
              • Passport must be readable
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Step 1: Face Photo</Text>
          <TouchableOpacity
            style={[styles.photoCard, { backgroundColor: theme.card }]}
            onPress={() => canUpload && showPhotoOptions('face')}
            disabled={!canUpload || uploadingFace}
          >
            {facePhotoUri ? (
              <Image source={{ uri: facePhotoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color={theme.text + '33'} />
                <Text style={[styles.photoPlaceholderText, { color: theme.text + '66' }]}>
                  Upload Selfie
                </Text>
              </View>
            )}
            {uploadingFace && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Step 2: Passport Photo</Text>
          <TouchableOpacity
            style={[styles.photoCard, { backgroundColor: theme.card }]}
            onPress={() => canUpload && showPhotoOptions('passport')}
            disabled={!canUpload || uploadingPassport}
          >
            {passportPhotoUri ? (
              <Image source={{ uri: passportPhotoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="document" size={48} color={theme.text + '33'} />
                <Text style={[styles.photoPlaceholderText, { color: theme.text + '66' }]}>
                  Upload Passport Photo
                </Text>
              </View>
            )}
            {uploadingPassport && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {canSubmit && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.tint }]}
            onPress={submitVerification}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.submitButtonText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  resultCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultDate: {
    fontSize: 12,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  requirementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  photoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
