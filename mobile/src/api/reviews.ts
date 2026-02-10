import apiClient from './client';

export interface Review {
    id: string;
    orderId: string;
    masterId: string;
    clientId: string;
    rating: number;
    comment: string;
    isAnonymous: boolean;
    isVerified: boolean;
    helpfulCount: number;
    response?: string;
    responseAt?: string;
    tags?: string[];
    images?: string[];
    createdAt: string;
    updatedAt: string;
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    } | null;
    order?: {
        id: string;
        title: string;
    } | null;
}

export interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    verifiedReviews: number;
    needsResponse: number;
    recentReviews: Array<{
        id: string;
        rating: number;
        comment: string;
        clientName: string;
        clientAvatar?: string;
        isAnonymous: boolean;
        isVerified: boolean;
        createdAt: string;
    }>;
}

export interface CreateReviewRequest {
    orderId: string;
    rating: number;
    comment: string;
    isAnonymous?: boolean;
    tags?: string[];
    images?: string[];
}

export interface ReviewsResponse {
    data: Review[];
    pagination: {
        limit: number;
        hasMore: boolean;
        lastEvaluatedKey?: string;
    };
}

export const reviewsApi = {
    // Get reviews for a master
    listReviews: (masterId: string, params?: { 
        limit?: number; 
        rating?: number; 
        verified?: boolean;
        lastEvaluatedKey?: string;
    }) => apiClient.get<ReviewsResponse>(`/masters/${masterId}/reviews`, { params }),

    // Get review statistics for a master
    getReviewStats: (masterId: string) => 
        apiClient.get<ReviewStats>(`/masters/${masterId}/reviews/stats`),

    // Get my reviews (as client)
    getMyReviews: (params?: { limit?: number }) => 
        apiClient.get<ReviewsResponse>('/reviews/my', { params }),

    // Create a review (client only)
    createReview: (data: CreateReviewRequest) => 
        apiClient.post<Review>('/reviews', data),

    // Update a review (within edit window)
    updateReview: (reviewId: string, data: Partial<CreateReviewRequest>) => 
        apiClient.put<Review>(`/reviews/${reviewId}`, data),

    // Delete a review
    deleteReview: (reviewId: string) => 
        apiClient.delete(`/reviews/${reviewId}`),

    // Respond to a review (master only)
    respondToReview: (reviewId: string, response: string) => 
        apiClient.post<Review>(`/reviews/${reviewId}/respond`, { response }),

    // Mark review as helpful
    markHelpful: (reviewId: string) => 
        apiClient.post(`/reviews/${reviewId}/helpful`),

    // Report a review
    reportReview: (reviewId: string, reason: string) => 
        apiClient.post(`/reviews/${reviewId}/report`, { reason }),

    // Get reviews that need response (master only)
    getNeedsResponse: () => 
        apiClient.get<ReviewsResponse>('/reviews/needs-response'),
};
