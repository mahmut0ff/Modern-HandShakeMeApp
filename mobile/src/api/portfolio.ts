import apiClient from './client';

export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    images: string[];
    skills: string[];
    cost?: number;
    durationDays?: number;
    clientReview?: string;
    clientRating?: number;
    category?: {
        id: string;
        name: string;
    };
    isPublic: boolean;
    viewsCount: number;
    createdAt: string;
    updatedAt?: string;
}

export interface CreatePortfolioItemRequest {
    title: string;
    description: string;
    images: string[];
    skills: string[];
    cost?: number;
    durationDays?: number;
    categoryId?: string;
    clientReview?: string;
    clientRating?: number;
    isPublic?: boolean;
}

export interface UpdatePortfolioItemRequest {
    title?: string;
    description?: string;
    images?: string[];
    skills?: string[];
    cost?: number;
    durationDays?: number;
    categoryId?: string;
    clientReview?: string;
    clientRating?: number;
    isPublic?: boolean;
}

export interface ListPortfolioParams {
    masterId?: string;
    categoryId?: string;
    skills?: string;
    isPublic?: boolean;
    includePrivate?: boolean;
    sortBy?: 'recent' | 'popular' | 'rating';
    page?: number;
    pageSize?: number;
}

export interface PortfolioListResponse {
    results: PortfolioItem[];
    count: number;
    next: string | null;
    previous: string | null;
}

export const portfolioApi = {
    // List portfolio items
    listPortfolio: (params?: ListPortfolioParams) =>
        apiClient.get<PortfolioListResponse>('/portfolio', { params }),

    // Get single portfolio item
    getPortfolioItem: (itemId: string) =>
        apiClient.get<PortfolioItem>(`/portfolio/${itemId}`),

    // Create portfolio item
    createPortfolioItem: (data: CreatePortfolioItemRequest) =>
        apiClient.post<PortfolioItem>('/portfolio', data),

    // Update portfolio item
    updatePortfolioItem: (itemId: string, data: UpdatePortfolioItemRequest) =>
        apiClient.patch<PortfolioItem>(`/portfolio/${itemId}`, data),

    // Delete portfolio item
    deletePortfolioItem: (itemId: string) =>
        apiClient.delete(`/portfolio/${itemId}`),

    // Upload portfolio image
    uploadPortfolioImage: async (imageUri: string) => {
        const formData = new FormData();
        // @ts-ignore
        formData.append('image', {
            uri: imageUri,
            name: 'portfolio-image.jpg',
            type: 'image/jpeg',
        });
        return apiClient.post<{ url: string }>('/portfolio/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
