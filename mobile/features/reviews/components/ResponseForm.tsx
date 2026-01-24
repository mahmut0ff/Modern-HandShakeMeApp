import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../../../constants/Colors';

export interface ResponseFormData {
  response: string;
}

export interface ResponseFormProps {
  initialResponse?: string;
  onSubmit: (data: ResponseFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  reviewerName?: string;
}

export const ResponseForm: React.FC<ResponseFormProps> = ({
  initialResponse = '',
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Submit Response',
  reviewerName,
}) => {
  const [response, setResponse] = useState(initialResponse);

  const handleSubmit = () => {
    if (response.trim().length === 0) {
      Alert.alert('Response Required', 'Please write a response before submitting.');
      return;
    }

    if (response.trim().length < 10) {
      Alert.alert('Response Too Short', 'Please write at least 10 characters.');
      return;
    }

    onSubmit({ response: response.trim() });
  };

  return (
    <View style={styles.container}>
      {reviewerName && (
        <Text style={styles.reviewerInfo}>
          Responding to review from {reviewerName}
        </Text>
      )}

      <Text style={styles.label}>Your Response</Text>
      <TextInput
        style={styles.input}
        placeholder="Thank the reviewer and address any concerns..."
        placeholderTextColor={Colors.gray[400]}
        value={response}
        onChangeText={setResponse}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={500}
      />
      <Text style={styles.characterCount}>{response.length}/500</Text>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Tips for a good response:</Text>
        <Text style={styles.tipItem}>• Thank the reviewer for their feedback</Text>
        <Text style={styles.tipItem}>• Address any concerns professionally</Text>
        <Text style={styles.tipItem}>• Keep it brief and positive</Text>
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
          {isLoading ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reviewerInfo: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
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
    marginBottom: 16,
  },
  tips: {
    backgroundColor: Colors.blue[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
