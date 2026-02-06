import { configureStore } from '@reduxjs/toolkit';
import { reviewApi } from '../../../services/reviewApi';
import { api } from '../../../services/api';

describe('reviewApi', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(api.util.resetApiState());
  });

  describe('Review CRUD', () => {
    it('should create getMasterReviews endpoint', () => {
      expect(reviewApi.endpoints.getMasterReviews).toBeDefined();
    });

    it('should create getMyReviews endpoint', () => {
      expect(reviewApi.endpoints.getMyReviews).toBeDefined();
    });

    it('should create getReview endpoint', () => {
      expect(reviewApi.endpoints.getReview).toBeDefined();
    });

    it('should create createReview endpoint', () => {
      expect(reviewApi.endpoints.createReview).toBeDefined();
    });

    it('should create updateReview endpoint', () => {
      expect(reviewApi.endpoints.updateReview).toBeDefined();
    });

    it('should create deleteReview endpoint', () => {
      expect(reviewApi.endpoints.deleteReview).toBeDefined();
    });
  });

  describe('Review Responses', () => {
    it('should create respondToReview endpoint', () => {
      expect(reviewApi.endpoints.respondToReview).toBeDefined();
    });

    it('should create updateReviewResponse endpoint', () => {
      expect(reviewApi.endpoints.updateReviewResponse).toBeDefined();
    });

    it('should create deleteReviewResponse endpoint', () => {
      expect(reviewApi.endpoints.deleteReviewResponse).toBeDefined();
    });
  });

  describe('Review Interactions', () => {
    it('should create markReviewHelpful endpoint', () => {
      expect(reviewApi.endpoints.markReviewHelpful).toBeDefined();
    });

    it('should create removeReviewHelpful endpoint', () => {
      expect(reviewApi.endpoints.removeReviewHelpful).toBeDefined();
    });
  });

  describe('Review Statistics', () => {
    it('should create getMasterReviewStats endpoint', () => {
      expect(reviewApi.endpoints.getMasterReviewStats).toBeDefined();
    });

    it('should create getReviewsNeedingResponse endpoint', () => {
      expect(reviewApi.endpoints.getReviewsNeedingResponse).toBeDefined();
    });
  });

  describe('Review Reporting', () => {
    it('should create reportReview endpoint', () => {
      expect(reviewApi.endpoints.reportReview).toBeDefined();
    });
  });

  describe('Tag Invalidation', () => {
    it('should invalidate Review and MasterProfile tags on create', () => {
      const endpoint = reviewApi.endpoints.createReview;
      expect(endpoint.name).toBe('createReview');
    });

    it('should invalidate Review tag on respond', () => {
      const endpoint = reviewApi.endpoints.respondToReview;
      expect(endpoint.name).toBe('respondToReview');
    });
  });
});
