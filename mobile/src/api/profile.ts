import apiClient from './client';

export interface UserProfile {
    id: string;
    phone: string;
    telegramUsername?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: 'CLIENT' | 'MASTER';
    city?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ClientProfile {
    profileId: string;
    userId: string;
    preferredContactMethod?: 'phone' | 'chat' | 'email';
    notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    createdAt: string;
    updatedAt?: string;
}

export interface MasterProfile {
    profileId: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    categories: number[];
    skills: number[];
    bio?: string;
    experienceYears?: number;
    hourlyRate?: string;
    dailyRate?: string;
    minOrderAmount?: string;
    maxOrderAmount?: string;
    city: string;
    isVerified: boolean;
    isAvailable: boolean;
    rating: string;
    reviewsCount: number;
    completedOrders: number;
    successRate: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ProfileStats {
    totalOrders?: number;
    activeOrders?: number;
    completedOrders?: number;
    totalApplications?: number;
    acceptedApplications?: number;
    averageRating?: number;
    totalEarned?: number;
    totalSpent?: number;
    responseTime?: string;
    memberSince?: string;
}

export interface VisibilitySettings {
    showOnlineStatus: boolean;
    allowMessagesFrom: 'EVERYONE' | 'VERIFIED_ONLY' | 'NONE';
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    showInSearch: boolean;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    city?: string;
}

export interface UpdateClientProfileRequest {
    preferredContactMethod?: 'phone' | 'chat' | 'email';
    notificationPreferences?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
    };
}

export interface UpdateMasterProfileRequest {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    categories?: number[];
    skills?: number[];
    bio?: string;
    experienceYears?: number;
    hourlyRate?: string;
    dailyRate?: string;
    minOrderAmount?: string;
    maxOrderAmount?: string;
    city?: string;
    isAvailable?: boolean;
}

export const profileApi = {
    // User profile operations
    getCurrentUser: () =>
        apiClient.get<UserProfile>('/profile/me'),

    updateCurrentUser: (data: UpdateUserRequest) =>
        apiClient.patch<UserProfile>('/profile/me', data),

    uploadAvatar: async (imageUri: string) => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('avatar', {
            uri: imageUri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
        });
        return apiClient.post<{ avatar: string }>('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteAvatar: () =>
        apiClient.delete('/profile/avatar'),

    // Client profile operations
    getClientProfile: () =>
        apiClient.get<ClientProfile>('/profile/client'),

    updateClientProfile: (data: UpdateClientProfileRequest) =>
        apiClient.patch<ClientProfile>('/profile/client', data),

    // Master profile operations
    getMasterProfile: () =>
        apiClient.get<MasterProfile>('/profile/master'),

    updateMasterProfile: (data: UpdateMasterProfileRequest) =>
        apiClient.patch<MasterProfile>('/profile/master', data),

    // Visibility settings
    getVisibilitySettings: () =>
        apiClient.get<VisibilitySettings>('/profile/visibility'),

    updateVisibilitySettings: (data: Partial<VisibilitySettings>) =>
        apiClient.patch<VisibilitySettings>('/profile/visibility', data),

    // Dashboard stats
    getClientStats: () =>
        apiClient.get<ProfileStats>('/clients/me/dashboard-stats'),

    getMasterStats: () =>
        apiClient.get<ProfileStats>('/masters/me/dashboard-stats'),
};
