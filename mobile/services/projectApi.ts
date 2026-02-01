import { api } from './api';

export interface Project {
  id: number;
  order: {
    id: number;
    title: string;
    description: string;
    category_name: string;
    budget_display: string;
    address?: string;
    city: string;
  };
  order_title?: string;
  order_description?: string;
  order_category_name?: string;
  order_budget_display?: string;
  order_address?: string;
  order_city?: string;
  client: {
    id: number;
    name: string;
    avatar: string | null;
    rating: string;
    phone?: string | null;
  };
  client_name?: string;
  client_avatar?: string | null;
  client_rating?: string;
  client_phone?: string | null;
  master: {
    id: number;
    name: string;
    avatar: string | null;
    rating: string;
    phone?: string | null;
  };
  master_name?: string;
  master_avatar?: string | null;
  master_rating?: string;
  master_phone?: string | null;
  agreed_price: string;
  start_date: string;
  end_date?: string;
  estimated_duration?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  status_display?: string;
  progress: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  files?: ProjectFile[];
  milestones?: ProjectMilestone[];
  payments?: ProjectPayment[];
}

export interface ProjectFile {
  id: number;
  file: string;
  file_url: string;
  file_type: 'photo' | 'video' | 'document';
  thumbnail?: string;
  description?: string;
  uploaded_by: 'client' | 'master';
  created_at: string;
}

export interface ProjectMilestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  orderNum?: number;
  createdAt: string;
  completedAt?: string;
}

export interface ProjectPayment {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  userId: number;
  walletId: number;
  projectId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectUpdateData {
  status?: 'in_progress' | 'completed' | 'cancelled';
  progress?: number;
  description?: string;
  notes?: string;
  end_date?: string;
}

export interface ProjectMilestoneCreateData {
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  orderNum?: number;
}

export interface ProjectMilestoneUpdateData {
  title?: string;
  description?: string;
  amount?: number;
  dueDate?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  orderNum?: number;
}

export const projectApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get my projects (for both clients and masters)
    getMyProjects: builder.query<Project[], { status?: string; role?: 'client' | 'master'; ordering?: string }>({
      query: (params) => ({
        url: '/projects/my',
        params,
      }),
      transformResponse: (response: any) => {
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        return response;
      },
      providesTags: ['Project'],
    }),

    // Get single project
    getProject: builder.query<Project, number>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project'],
    }),

    // Update project
    updateProject: builder.mutation<Project, { id: number; data: ProjectUpdateData }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),

    // Complete project
    completeProject: builder.mutation<Project, { id: number; notes?: string }>({
      query: ({ id, notes }) => ({
        url: `/projects/${id}/complete`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Project'],
    }),

    // Cancel project
    cancelProject: builder.mutation<Project, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/projects/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Project'],
    }),

    // Project files
    getProjectFiles: builder.query<ProjectFile[], number>({
      query: (projectId) => `/projects/${projectId}/files`,
      providesTags: ['Project'],
    }),

    addProjectFile: builder.mutation<ProjectFile, { projectId: number; file: FormData }>({
      query: ({ projectId, file }) => ({
        url: `/projects/${projectId}/files`,
        method: 'POST',
        body: file,
        formData: true,
      }),
      invalidatesTags: ['Project'],
    }),

    deleteProjectFile: builder.mutation<void, number>({
      query: (fileId) => ({
        url: `/projects/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),

    // Project milestones
    getProjectMilestones: builder.query<ProjectMilestone[], number>({
      query: (projectId) => `/projects/${projectId}/milestones`,
      providesTags: ['Project'],
    }),

    createProjectMilestone: builder.mutation<ProjectMilestone, { projectId: number; data: ProjectMilestoneCreateData }>({
      query: ({ projectId, data }) => ({
        url: `/projects/${projectId}/milestones`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),

    updateProjectMilestone: builder.mutation<ProjectMilestone, { id: number; projectId: number; data: ProjectMilestoneUpdateData }>({
      query: ({ id, projectId, data }) => ({
        url: `/projects/${projectId}/milestones/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),

    deleteProjectMilestone: builder.mutation<void, { id: number; projectId: number }>({
      query: ({ id, projectId }) => ({
        url: `/projects/${projectId}/milestones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),

    // Project payments
    getProjectPayments: builder.query<ProjectPayment[], number>({
      query: (projectId) => `/projects/${projectId}/payments`,
      providesTags: ['Project'],
    }),
  }),
});

export const {
  useGetMyProjectsQuery,
  useGetProjectQuery,
  useUpdateProjectMutation,
  useCompleteProjectMutation,
  useCancelProjectMutation,
  useGetProjectFilesQuery,
  useAddProjectFileMutation,
  useDeleteProjectFileMutation,
  useGetProjectMilestonesQuery,
  useCreateProjectMilestoneMutation,
  useUpdateProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  useGetProjectPaymentsQuery,
} = projectApi;