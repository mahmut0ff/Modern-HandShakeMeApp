import React from 'react';
import { FlatList, View, Text, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { ReviewItem, Review } from './ReviewItem';
import { EmptyReviews } from './EmptyReviews';
import Colors from '../../../constants/Colors';

export interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUserId?: number;
  onEdit?: (reviewId: number) => void;
  onDelete?: (reviewId: number) => void;
  onRespond?: (reviewId: number) => void;
  onReport?: (reviewId: number) => void;
  onMarkHelpful?: (reviewId: number) => void;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  currentUserId,
  onEdit,
  onDelete,
  onRespond,
  onReport,
  onMarkHelpful,
  emptyMessage,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  const renderItem = ({ item }: { item: Review }) => (
    <ReviewItem
      review={item}
      currentUserId={currentUserId}
      onEdit={() => onEdit?.(item.id)}
      onDelete={() => onDelete?.(item.id)}
      onRespond={() => onRespond?.(item.id)}
      onReport={() => onReport?.(item.id)}
      onMarkHelpful={() => onMarkHelpful?.(item.id)}
    />
  );

  const renderFooter = () => {
    if (!hasMore) return ListFooterComponent || null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading more reviews...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      );
    }

    return <EmptyReviews message={emptyMessage} />;
  };

  return (
    <FlatList
      data={reviews}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.contentContainer,
        reviews.length === 0 && styles.emptyContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 8,
  },
});
