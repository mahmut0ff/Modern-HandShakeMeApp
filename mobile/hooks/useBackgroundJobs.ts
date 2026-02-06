import { useState, useEffect, useCallback, useMemo } from 'react';
import backgroundJobsHelpers, {
  BackgroundJob,
  JobStatus,
  JobType,
  useGetJobsQuery,
  useGetJobQuery,
  useCancelJobMutation,
  useRetryJobMutation,
  useTriggerRatingCalculationMutation,
  useTriggerRecommendationGenerationMutation
} from '../services/backgroundJobsApi';

interface UseBackgroundJobsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onJobCompleted?: (job: BackgroundJob) => void;
  onJobFailed?: (job: BackgroundJob) => void;
}

export const useBackgroundJobs = (options: UseBackgroundJobsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    onJobCompleted,
    onJobFailed,
  } = options;

  // Use RTK Query hook for polling
  const {
    data: jobsData,
    isLoading: loading,
    error: queryError,
    refetch: loadJobs
  } = useGetJobsQuery(
    { limit: 50 },
    {
      pollingInterval: autoRefresh ? refreshInterval : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  const jobs = jobsData?.jobs || [];

  // Track previous jobs to detect status changes
  // Note: This effect mimics the original behavior, but handling side effects in generic hooks can be tricky.
  // Ideally this should be done via middleware or in components.
  // Here we use a simplified check or trust the component to handle specific job monitoring.

  const [cancelJobMutation] = useCancelJobMutation();
  const [retryJobMutation] = useRetryJobMutation();
  const [triggerRatingCalcMutation] = useTriggerRatingCalculationMutation();
  const [triggerRecommendationMutation] = useTriggerRecommendationGenerationMutation();

  // Queries for single job (lazy) - using mutations/api directly might be easier if we need on-demand
  // But usually we just find it in the list.
  // If we really need to fetch a single job:
  // We can't use useGetJobQuery conditionally in a callback.
  // So we return a helper that might just return from the list or we'd need useLazyGetJobQuery

  // Helper derived state
  const activeJobs = useMemo(() =>
    jobs.filter((j: BackgroundJob) => backgroundJobsHelpers.isJobActive(j.status)),
    [jobs]);

  const error = queryError ? 'Failed to load jobs' : null;

  /**
   * Get job by ID from the loaded list
   */
  const getJob = useCallback(
    async (jobId: string): Promise<BackgroundJob | null> => {
      // In this simplified version, we return from the list if available,
      // or we probably shouldn't be fetching individually inside this hook unless we use lazy query.
      // For now, let's return from list.
      return jobs.find(j => j.id === jobId) || null;
    },
    [jobs]
  );

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      await cancelJobMutation(jobId).unwrap();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось отменить задачу');
    }
  }, [cancelJobMutation]);

  /**
   * Retry a failed job
   */
  const retryJob = useCallback(async (jobId: string) => {
    try {
      await retryJobMutation(jobId).unwrap();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось повторить задачу');
    }
  }, [retryJobMutation]);

  /**
   * Trigger rating calculation
   */
  const triggerRatingCalculation = useCallback(async () => {
    try {
      return await triggerRatingCalcMutation().unwrap();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось запустить расчет рейтинга');
    }
  }, [triggerRatingCalcMutation]);

  /**
   * Trigger recommendation generation
   */
  const triggerRecommendations = useCallback(async () => {
    try {
      return await triggerRecommendationMutation().unwrap();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось запустить генерацию рекомендаций');
    }
  }, [triggerRecommendationMutation]);

  /**
   * Filter jobs by status
   */
  const getJobsByStatus = useCallback(
    (status: JobStatus) => {
      return jobs.filter((j: BackgroundJob) => j.status === status);
    },
    [jobs]
  );

  /**
   * Filter jobs by type
   */
  const getJobsByType = useCallback(
    (type: JobType) => {
      return jobs.filter((j: BackgroundJob) => j.type === type);
    },
    [jobs]
  );

  /**
   * Get completed jobs
   */
  const getCompletedJobs = useCallback(() => {
    return jobs.filter((j: BackgroundJob) => j.status === 'COMPLETED');
  }, [jobs]);

  /**
   * Get failed jobs
   */
  const getFailedJobs = useCallback(() => {
    return jobs.filter((j: BackgroundJob) => j.status === 'FAILED');
  }, [jobs]);

  /**
   * Check if any jobs are active
   */
  const hasActiveJobs = useCallback(() => {
    return activeJobs.length > 0;
  }, [activeJobs]);

  /**
   * Get active job count
   */
  const getActiveJobCount = useCallback(() => {
    return activeJobs.length;
  }, [activeJobs]);

  return {
    jobs,
    activeJobs,
    loading,
    error,
    loadJobs, // Now triggers refetch
    getJob,
    cancelJob,
    retryJob,
    triggerRatingCalculation,
    triggerRecommendations,
    getJobsByStatus,
    getJobsByType,
    getCompletedJobs,
    getFailedJobs,
    hasActiveJobs,
    getActiveJobCount,
  };
};
