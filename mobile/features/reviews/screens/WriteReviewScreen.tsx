import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ReviewForm, ReviewFormData } from '../components/ReviewForm';
import { useCreateReviewMutation } from '../../../services/reviewApi';
import Colors from '../../../constants/Colors';

export const WriteReviewScreen: React.FC = () => {
  const params = useLocalSearchParams<{
    orderId: string;
    projectId?: string;
    projectTitle?: string;
    masterName?: string;
  }>();

  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      await createReview({
        order: parseInt(params.orderId),
        project: params.projectId ? parseInt(params.projectId) : undefined,
        rating: data.rating,
        comment: data.comment || undefined,
        is_anonymous: data.isAnonymous,
      }).unwrap();

      Alert.alert(
        'Success',
        'Your review has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create review:', error);
      Alert.alert(
        'Error',
        error?.data?.message || 'Failed to submit review. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Review?',
      'Are you sure you want to discard this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Write a Review</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ReviewForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Submit Review"
          projectTitle={params.projectTitle}
          masterName={params.masterName}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
