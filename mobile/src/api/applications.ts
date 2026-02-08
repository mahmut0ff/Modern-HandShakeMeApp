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
    rejection_reason?: string;
    is_favorite?: boolean;
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

    respondToApplication: (orderId: string, applicationId: string, action: 'ACCEPT' | 'REJECT' | 'LIKE', rejectionReason?: string) =>
        apiClient.post<any>(`/orders/${orderId}/applications/${applicationId}/respond`, { action, rejectionReason }),

    deleteApplication: (applicationId: string, orderId: string) =>
        apiClient.delete<void>(`/applications/${applicationId}`, { params: { orderId } }),

    markViewed: (applicationId: string, orderId: string) =>
        apiClient.post<void>(`/applications/${applicationId}/view`, null, { params: { orderId } }),
};
