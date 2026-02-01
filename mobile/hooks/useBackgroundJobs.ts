import { useState, useEffect, useCallback, useRef } from 'react';
import backgroundJobsApi, { BackgroundJob, JobStatus, JobType } from '../services/backgroundJobsApi';

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

  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousJobsRef = useRef<Map<string, JobStatus>>(new Map());

  /**
   * Load all jobs
   */
  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const response = await backgroundJobsApi.getJobs({ limit: 50 });
      
      // Check for status changes
      response.jobs.forEach((job) => {
        const previousStatus = previousJobsRef.current.get(job.id);
        
        if (previousStatus && previousStatus !== job.status) {
          if (job.status === 'COMPLETED' && onJobCompleted) {
            onJobCompleted(job);
          } else if (job.status === 'FAILED' && onJobFailed) {
            onJobFailed(job);
          }
        }
        
        previousJobsRef.current.set(job.id, job.status);
      });

      setJobs(response.jobs);
      setActiveJobs(response.jobs.filter((j) => backgroundJobsApi.isJobActive(j.status)));
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [onJobCompleted, onJobFailed]);

  /**
   * Get job by ID
   */
  const getJob = useCallback(
    async (jobId: string): Promise<BackgroundJob | null> => {
      try {
        return await backgroundJobsApi.getJob(jobId);
      } catch (err) {
        return null;
      }
    },
    []
  );

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      await backgroundJobsApi.cancelJob(jobId);
      await loadJobs();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось отменить задачу');
    }
  }, [loadJobs]);

  /**
   * Retry a failed job
   */
  const retryJob = useCallback(async (jobId: string) => {
    try {
      await backgroundJobsApi.retryJob(jobId);
      await loadJobs();
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось повторить задачу');
    }
  }, [loadJobs]);

  /**
   * Trigger rating calculation
   */
  const triggerRatingCalculation = useCallback(async () => {
    try {
      const job = await backgroundJobsApi.triggerRatingCalculation();
      await loadJobs();
      return job;
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось запустить расчет рейтинга');
    }
  }, [loadJobs]);

  /**
   * Trigger recommendation generation
   */
  const triggerRecommendations = useCallback(async () => {
    try {
      const job = await backgroundJobsApi.triggerRecommendationGeneration();
      await loadJobs();
      return job;
    } catch (err: any) {
      throw new Error(err.message || 'Не удалось запустить генерацию рекомендаций');
    }
  }, [loadJobs]);

  /**
   * Filter jobs by status
   */
  const getJobsByStatus = useCallback(
    (status: JobStatus) => {
      return jobs.filter((j) => j.status === status);
    },
    [jobs]
  );

  /**
   * Filter jobs by type
   */
  const getJobsByType = useCallback(
    (type: JobType) => {
      return jobs.filter((j) => j.type === type);
    },
    [jobs]
  );

  /**
   * Get completed jobs
   */
  const getCompletedJobs = useCallback(() => {
    return jobs.filter((j) => j.status === 'COMPLETED');
  }, [jobs]);

  /**
   * Get failed jobs
   */
  const getFailedJobs = useCallback(() => {
    return jobs.filter((j) => j.status === 'FAILED');
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

  // Auto-refresh
  useEffect(() => {
    loadJobs();

    if (autoRefresh) {
      const interval = setInterval(loadJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadJobs]);

  return {
    jobs,
    activeJobs,
    loading,
    error,
    loadJobs,
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
