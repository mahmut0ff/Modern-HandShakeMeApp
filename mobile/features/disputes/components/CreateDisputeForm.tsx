import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface CreateDisputeFormData {
  reason: string;
  description: string;
  amountDisputed?: number;
}

export interface CreateDisputeFormProps {
  projectTitle: string;
  onSubmit: (data: CreateDisputeFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const DISPUTE_REASONS = [
  { value: 'quality', label: 'Quality Issue', icon: 'construct' },
  { value: 'payment', label: 'Payment Dispute', icon: 'cash' },
  { value: 'deadline', label: 'Deadline Issue', icon: 'time' },
  { value: 'communication', label: 'Communication Problem', icon: 'chatbubbles' },
  { value: 'scope', label: 'Scope Disagreement', icon: 'document-text' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export const CreateDisputeForm: React.FC<CreateDisputeFormProps> = ({
  projectTitle,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [amountDisputed, setAmountDisputed] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a dispute reason');
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert('Description Too Short', 'Please provide at least 20 characters');
      return;
    }

    const data: CreateDisputeFormData = {
      reason: selectedReason,
      description: description.trim(),
    };

    if (amountDisputed && parseFloat(amountDisputed) > 0) {
      data.amountDisputed = parseFloat(amountDisputed);
    }

    onSubmit(data);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.projectInfo}>
        <Text style={styles.projectLabel}>Project</Text>
        <Text style={styles.projectTitle}>{projectTitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispute Reason *</Text>
        <View style={styles.reasonsGrid}>
          {DISPUTE_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonCard,
                selectedReason === reason.value && styles.reasonCardSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <Ionicons
                name={reason.icon as any}
                size={24}
                color={selectedReason === reason.value ? Colors.primary : Colors.gray[600]}
              />
              <Text
                style={[
                  styles.reasonLabel,
                  selectedReason === reason.value && styles.reasonLabelSelected,
                ]}
              >
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe the issue in detail..."
          placeholderTextColor={Colors.gray[400]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.characterCount}>{description.length}/1000</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount Disputed (Optional)</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.gray[400]}
            value={amountDisputed}
            onChangeText={setAmountDisputed}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={styles.hint}>
          Enter the amount if this is a payment-related dispute
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Ionicons name="information-circle" size={20} color={Colors.orange[600]} />
        <Text style={styles.warningText}>
          Filing a dispute will notify all parties and may affect your relationship.
          Please try to resolve issues through communication first.
        </Text>
      </View>

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting...' : 'Submit Dispute'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  projectInfo: {
    backgroundColor: Colors.blue[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  projectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reasonCard: {
    width: '47%',
    padding: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  reasonCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.blue[50],
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
    textAlign: 'center',
  },
  reasonLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.dark,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[600],
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.orange[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.orange[700],
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
