import apiClient from './client';
import { User } from '../context/AuthContext';

export interface PortfolioItem {
    id: string;
    masterId: string;
    title: string;
    description: string;
    images: string[];
    skills: string[];
    cost?: number;
    durationDays?: number;
    categoryId?: string;
    clientReview?: string;
    clientRating?: number;
    isPublic: boolean;
    viewsCount: number;
    createdAt: string;
    updatedAt: string;
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
    portfolioPreview?: string[];
    user?: Partial<User>;
    portfolio?: PortfolioItem[];
    reviews?: any[]; // Detailed reviews for profile view
}

export interface MastersResponse {
    data: MasterProfile[];
    count: number;
    success: boolean;
}

export interface MasterProfileResponse extends MasterProfile {
    success: boolean;
}

export const mastersApi = {
    listMasters: (params?: {
        category_id?: string;
        city?: string;
        min_rating?: number;
        is_available?: boolean;
        page?: number;
        page_size?: number;
        with_portfolio?: boolean;
    }) =>
        apiClient.get<MastersResponse>('/masters', { params }),

    getMasterProfile: (masterId: string) =>
        apiClient.get<MasterProfile>(`/masters/${masterId}`),

    getPortfolio: (masterId: string) =>
        apiClient.get<{ items: PortfolioItem[] }>(`/masters/${masterId}/portfolio`), // Assuming a helper or the profile returns it
};
