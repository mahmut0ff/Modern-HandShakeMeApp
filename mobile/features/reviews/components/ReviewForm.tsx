import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from './RatingStars';
import Colors from '../../../constants/Colors';

export interface ReviewFormData {
  rating: number;
  comment: string;
  isAnonymous: boolean;
}

export interface ReviewFormProps {
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  projectTitle?: string;
  masterName?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Submit Review',
  projectTitle,
  masterName,
}) => {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    onSubmit({ rating, comment, isAnonymous });
  };

  const getRatingLabel = (value: number): string => {
    if (value === 0) return 'Tap to rate';
    if (value === 1) return 'Poor';
    if (value === 2) return 'Below Average';
    if (value === 3) return 'Average';
    if (value === 4) return 'Good';
    return 'Excellent';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Project Info */}
      {(projectTitle || masterName) && (
        <View style={styles.projectInfo}>
          {projectTitle && (
            <Text style={styles.projectTitle}>{projectTitle}</Text>
          )}
          {masterName && (
            <Text style={styles.masterName}>Master: {masterName}</Text>
          )}
        </View>
      )}

      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Rating</Text>
        <View style={styles.ratingContainer}>
          <RatingStars
            rating={rating}
            size="large"
            interactive
            onChange={setRating}
          />
          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
        </View>
      </View>

      {/* Comment Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience with this master..."
          placeholderTextColor={Colors.gray[400]}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.characterCount}>{comment.length}/1000</Text>
      </View>

      {/* Anonymous Option */}
      <TouchableOpacity
        style={styles.anonymousOption}
        onPress={() => setIsAnonymous(!isAnonymous)}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          {isAnonymous && (
            <Ionicons name="checkmark" size={18} color={Colors.primary} />
          )}
        </View>
        <View style={styles.anonymousText}>
          <Text style={styles.anonymousLabel}>Post anonymously</Text>
          <Text style={styles.anonymousDescription}>
            Your name will be hidden from the public
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  projectInfo: {
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  masterName: {
    fontSize: 14,
    color: Colors.gray[600],
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
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 12,
  },
  commentInput: {
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
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  anonymousText: {
    flex: 1,
  },
  anonymousLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  anonymousDescription: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
