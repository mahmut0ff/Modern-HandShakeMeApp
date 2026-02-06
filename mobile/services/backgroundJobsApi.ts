import { api } from './api';

export type JobType =
  | 'RATING_CALCULATION'
  | 'RECOMMENDATION_GENERATION'
  | 'DATA_EXPORT'
  | 'PROFILE_SYNC'
  | 'NOTIFICATION_BATCH'
  | 'ANALYTICS_PROCESSING';

export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0-100
  title: string;
  description?: string;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  result?: any;
  metadata?: {
    itemsProcessed?: number;
    itemsTotal?: number;
    estimatedTimeRemaining?: number; // seconds
  };
}

export interface JobsResponse {
  jobs: BackgroundJob[];
  activeCount: number;
  completedCount: number;
  failedCount: number;
}

export const backgroundJobsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<JobsResponse, { status?: JobStatus; type?: JobType; limit?: number } | void>({
      query: (params) => ({
        url: '/workers/jobs',
        params: params || {},
      }),
      providesTags: ['BackgroundCheck'],
    }),
    getJob: builder.query<BackgroundJob, string>({
      query: (jobId) => `/workers/jobs/${jobId}`,
      providesTags: ['BackgroundCheck'],
    }),
    cancelJob: builder.mutation<void, string>({
      query: (jobId) => ({
        url: `/workers/jobs/${jobId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),
    retryJob: builder.mutation<BackgroundJob, string>({
      query: (jobId) => ({
        url: `/workers/jobs/${jobId}/retry`,
        method: 'POST',
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),
    triggerRatingCalculation: builder.mutation<BackgroundJob, void>({
      query: () => ({
        url: '/workers/rating-calculation/trigger',
        method: 'POST',
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),
    triggerRecommendationGeneration: builder.mutation<BackgroundJob, void>({
      query: () => ({
        url: '/workers/recommendations/trigger',
        method: 'POST',
      }),
      invalidatesTags: ['BackgroundCheck'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useCancelJobMutation,
  useRetryJobMutation,
  useTriggerRatingCalculationMutation,
  useTriggerRecommendationGenerationMutation,
} = backgroundJobsApi;

class BackgroundJobsHelpers {
  /**
   * Get job type display info
   */
  getJobTypeInfo(type: JobType): {
    label: string;
    icon: string;
    color: string;
  } {
    const typeMap: Record<JobType, { label: string; icon: string; color: string }> = {
      RATING_CALCULATION: {
        label: 'Расчет рейтинга',
        icon: 'star',
        color: '#F59E0B',
      },
      RECOMMENDATION_GENERATION: {
        label: 'Генерация рекомендаций',
        icon: 'auto-awesome',
        color: '#3B82F6',
      },
      DATA_EXPORT: {
        label: 'Экспорт данных',
        icon: 'download',
        color: '#10B981',
      },
      PROFILE_SYNC: {
        label: 'Синхронизация профиля',
        icon: 'sync',
        color: '#6366F1',
      },
      NOTIFICATION_BATCH: {
        label: 'Отправка уведомлений',
        icon: 'notifications',
        color: '#8B5CF6',
      },
      ANALYTICS_PROCESSING: {
        label: 'Обработка аналитики',
        icon: 'analytics',
        color: '#EC4899',
      },
    };

    return typeMap[type] || { label: type, icon: 'work', color: '#6B7280' };
  }

  /**
   * Get job status display info
   */
  getJobStatusInfo(status: JobStatus): {
    label: string;
    color: string;
    icon: string;
  } {
    const statusMap: Record<JobStatus, { label: string; color: string; icon: string }> = {
      PENDING: {
        label: 'В очереди',
        color: '#6B7280',
        icon: 'schedule',
      },
      PROCESSING: {
        label: 'Обработка',
        color: '#3B82F6',
        icon: 'sync',
      },
      COMPLETED: {
        label: 'Завершено',
        color: '#10B981',
        icon: 'check-circle',
      },
      FAILED: {
        label: 'Ошибка',
        color: '#EF4444',
        icon: 'error',
      },
      CANCELLED: {
        label: 'Отменено',
        color: '#9CA3AF',
        icon: 'cancel',
      },
    };

    return statusMap[status] || { label: status, color: '#6B7280', icon: 'help' };
  }

  /**
   * Format estimated time remaining
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} сек`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} мин`;
    } else {
      return `${Math.round(seconds / 3600)} ч`;
    }
  }

  /**
   * Check if job is active
   */
  isJobActive(status: JobStatus): boolean {
    return status === 'PENDING' || status === 'PROCESSING';
  }

  /**
   * Check if job can be retried
   */
  canRetryJob(status: JobStatus): boolean {
    return status === 'FAILED' || status === 'CANCELLED';
  }

  /**
   * Check if job can be cancelled
   */
  canCancelJob(status: JobStatus): boolean {
    return status === 'PENDING' || status === 'PROCESSING';
  }
}

export const backgroundJobsHelpers = new BackgroundJobsHelpers();
export default backgroundJobsHelpers;
