import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from './RatingStars';
import { ReviewResponse } from './ReviewResponse';
import Colors from '../../../constants/Colors';

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  reviewer: {
    id: number;
    name: string;
    avatar?: string;
  };
  master: {
    id: number;
    name: string;
    avatar?: string;
  };
  project?: {
    id: number;
    title: string;
  };
  response?: {
    id: number;
    text: string;
    createdAt: string;
  };
  helpfulCount: number;
  isHelpfulByMe: boolean;
}

export interface ReviewItemProps {
  review: Review;
  showActions?: boolean;
  currentUserId?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onRespond?: () => void;
  onReport?: () => void;
  onMarkHelpful?: () => void;
}

const MAX_COMMENT_LENGTH = 200;

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  showActions = true,
  currentUserId,
  onEdit,
  onDelete,
  onRespond,
  onReport,
  onMarkHelpful,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnReview = currentUserId === review.reviewer.id;
  const needsReadMore = review.comment.length > MAX_COMMENT_LENGTH;
  const displayComment = isExpanded || !needsReadMore
    ? review.comment
    : review.comment.substring(0, MAX_COMMENT_LENGTH) + '...';

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleMenuAction = (action: 'edit' | 'delete' | 'report') => {
    setShowMenu(false);
    switch (action) {
      case 'edit':
        onEdit?.();
        break;
      case 'delete':
        onDelete?.();
        break;
      case 'report':
        onReport?.();
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.reviewerInfo}>
          {review.reviewer.avatar ? (
            <Image
              source={{ uri: review.reviewer.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color={Colors.gray[600]} />
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
              {review.isEdited && (
                <Text style={styles.editedBadge}> • Edited</Text>
              )}
            </View>
          </View>
        </View>

        {showActions && (
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={styles.menuButton}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={Colors.gray[600]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Menu */}
      {showMenu && (
        <View style={styles.menu}>
          {isOwnReview ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('edit')}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('delete')}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                <Text style={[styles.menuText, { color: Colors.danger }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('report')}
            >
              <Ionicons name="flag-outline" size={18} color={Colors.danger} />
              <Text style={[styles.menuText, { color: Colors.danger }]}>
                Report
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <RatingStars rating={review.rating} size="small" />
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{displayComment}</Text>
      {needsReadMore && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.readMore}>
            {isExpanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Response */}
      {review.response && (
        <ReviewResponse
          response={review.response}
          masterName={review.master.name}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={onMarkHelpful}
        >
          <Ionicons
            name={review.isHelpfulByMe ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={review.isHelpfulByMe ? Colors.primary : Colors.gray[600]}
          />
          <Text
            style={[
              styles.helpfulText,
              review.isHelpfulByMe && { color: Colors.primary },
            ]}
          >
            Helpful ({review.helpfulCount})
          </Text>
        </TouchableOpacity>

        {!review.response && !isOwnReview && onRespond && (
          <TouchableOpacity style={styles.respondButton} onPress={onRespond}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
            <Text style={styles.respondText}>Respond</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  editedBadge: {
    fontSize: 12,
    color: Colors.gray[500],
    fontStyle: 'italic',
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 14,
    color: Colors.dark,
    marginLeft: 8,
  },
  ratingContainer: {
    marginBottom: 12,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  helpfulText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginLeft: 6,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  respondText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
});
