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
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { verificationApi } from '@/src/api/verification';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AdminVerificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only admins can access this page');
      router.back();
      return;
    }
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setIsLoading(true);
      const response = await verificationApi.adminListPending();
      setVerifications(response.data.results);
    } catch (error: any) {
      console.error('Failed to fetch verifications', error);
      Alert.alert('Error', 'Failed to load verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (verification: any) => {
    Alert.alert(
      'Approve Verification',
      `Approve verification for ${verification.user.first_name} ${verification.user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await verificationApi.adminApprove(verification.id);
              Alert.alert('Success', 'Verification approved');
              fetchPendingVerifications();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error?.message || 'Failed to approve');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = (verification: any) => {
    setSelectedVerification(verification);
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setIsProcessing(true);
      await verificationApi.adminReject(selectedVerification.id, rejectionReason);
      Alert.alert('Success', 'Verification rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedVerification(null);
      fetchPendingVerifications();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient
        colors={[theme.tint, theme.tint + 'DD']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Verification Review</Text>
          <Text style={styles.headerSubtitle}>{verifications.length} pending</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {verifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color={theme.text + '33'} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No pending verifications
            </Text>
          </View>
        ) : (
          verifications.map((verification) => (
            <View key={verification.id} style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {verification.user.first_name} {verification.user.last_name}
                  </Text>
                  <Text style={[styles.userDetails, { color: theme.text + '66' }]}>
                    {verification.user.email || verification.user.phone}
                  </Text>
                  {verification.user.city && (
                    <Text style={[styles.userDetails, { color: theme.text + '66' }]}>
                      📍 {verification.user.city}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#FF9800' + '20' }]}>
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>
                    {verification.status}
                  </Text>
                </View>
              </View>

              <View style={styles.photosSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Photos</Text>
                <View style={styles.photosGrid}>
                  {verification.documents.map((doc: any) => (
                    <View key={doc.id} style={styles.photoContainer}>
                      <Image source={{ uri: doc.url }} style={styles.photo} />
                      <Text style={[styles.photoLabel, { color: theme.text + '99' }]}>
                        {doc.type.replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(verification)}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(verification)}
                  disabled={isProcessing}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Verification</Text>
            <Text style={[styles.modalSubtitle, { color: theme.text + '99' }]}>
              Please provide a reason for rejection
            </Text>

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text,
                borderColor: theme.text + '20',
              }]}
              placeholder="Reason for rejection..."
              placeholderTextColor={theme.text + '66'}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.text + '20' }]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={submitRejection}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  photosSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    flex: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  photoLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
