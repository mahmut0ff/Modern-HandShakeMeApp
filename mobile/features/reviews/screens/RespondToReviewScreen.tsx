import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ResponseForm, ResponseFormData } from '../components/ResponseForm';
import { 
  useRespondToReviewMutation, 
  useUpdateReviewResponseMutation,
  useGetReviewQuery 
} from '../../../services/reviewApi';
import Colors from '../../../constants/Colors';

export const RespondToReviewScreen: React.FC = () => {
  const params = useLocalSearchParams<{
    reviewId: string;
    isEdit?: string;
  }>();

  const reviewId = parseInt(params.reviewId);
  const isEdit = params.isEdit === 'true';

  const { data: review } = useGetReviewQuery(reviewId);
  const [respondToReview, { isLoading: isResponding }] = useRespondToReviewMutation();
  const [updateResponse, { isLoading: isUpdating }] = useUpdateReviewResponseMutation();

  const isLoading = isResponding || isUpdating;

  const handleSubmit = async (data: ResponseFormData) => {
    try {
      if (isEdit) {
        await updateResponse({
          id: reviewId,
          data: { response: data.response },
        }).unwrap();
      } else {
        await respondToReview({
          id: reviewId,
          data: { response: data.response },
        }).unwrap();
      }

      Alert.alert(
        'Success',
        `Your response has been ${isEdit ? 'updated' : 'submitted'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      Alert.alert(
        'Error',
        error?.data?.message || 'Failed to submit response. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Response?',
      'Are you sure you want to discard this response?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const reviewerName = review?.client?.name || review?.client_name || 'the reviewer';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEdit ? 'Edit Response' : 'Respond to Review'}
        </Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ResponseForm
          initialResponse={isEdit ? review?.response : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel={isEdit ? 'Update Response' : 'Submit Response'}
          reviewerName={reviewerName}
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
