import apiClient from './client';

export interface Application {
    id: string;
    order_id: string;
    order_title?: string;
    master_id: string;
    client_id: string;
    cover_letter: string;
    proposed_price?: number;
    proposed_duration_days?: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'VIEWED';
    viewed_at?: string;
    created_at: string;
    updated_at: string;
    master?: {
        id: string;
        name: string;
        avatar?: string;
        rating: number;
    };
    client?: {
        id: string;
        name: string;
        avatar?: string;
        rating: number;
    };
}

export interface CreateApplicationRequest {
    orderId: string;
    coverLetter: string;
    proposedPrice?: number;
    proposedDurationDays?: number;
}

export interface ApplicationsResponse {
    results: Application[];
    count: number;
}

export const applicationsApi = {
    getMyApplications: () =>
        apiClient.get<ApplicationsResponse>('/applications/my'),

    getOrderApplications: (orderId: string) =>
        apiClient.get<ApplicationsResponse>(`/orders/${orderId}/applications`),

    createApplication: (data: CreateApplicationRequest) =>
        apiClient.post<Application>('/applications', data),

    acceptApplication: (applicationId: string) =>
        apiClient.post<void>(`/applications/${applicationId}/accept`),

    rejectApplication: (applicationId: string) =>
        apiClient.put<Application>(`/applications/${applicationId}`, { status: 'REJECTED' }),

    markViewed: (applicationId: string) =>
        apiClient.post<void>(`/applications/${applicationId}/view`),
};
