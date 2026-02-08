import apiClient from './client';

export interface Order {
    id: string;
    clientId: string;
    categoryId: string;
    subcategory?: string;
    title: string;
    description: string;
    city: string;
    address: string;
    hideAddress: boolean;
    budgetType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
    budgetMin?: number;
    budgetMax?: number;
    startDate?: string;
    endDate?: string;
    status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'READY_TO_CONFIRM' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED' | 'CANCELLED';
    applicationsCount: number;
    viewsCount: number;
    isUrgent: boolean;
    masterId?: string;
    acceptedApplicationId?: string;

    // Additional details
    workVolume?: string;
    floor?: number;
    hasElevator?: boolean;
    materialStatus?: string;
    hasElectricity?: boolean;
    hasWater?: boolean;
    canStoreTools?: boolean;
    hasParking?: boolean;
    requiredExperience?: string;
    needTeam?: boolean;
    additionalRequirements?: string;
    images?: string[];

    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderRequest {
    title: string;
    description: string;
    categoryId: string;
    subcategory?: string;
    city: string;
    address?: string;
    hideAddress?: boolean;
    budgetType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
    budgetMin?: number;
    budgetMax?: number;
    startDate?: string;
    endDate?: string;
    isUrgent?: boolean;

    // Additional details
    workVolume?: string;
    floor?: number;
    hasElevator?: boolean;
    materialStatus?: string;
    hasElectricity?: boolean;
    hasWater?: boolean;
    canStoreTools?: boolean;
    hasParking?: boolean;
    requiredExperience?: string;
    needTeam?: boolean;
    additionalRequirements?: string;
    images?: string[];
}

export interface OrdersResponse {
    results: Order[];
    count: number;
}

export interface Review {
    id: string;
    order_id: string;
    client_id: string;
    master_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

export const ordersApi = {
    getMyOrders: (status?: string) =>
        apiClient.get<OrdersResponse>(status ? `/orders/my?status=${status}` : '/orders/my'),

    createOrder: (data: CreateOrderRequest) =>
        apiClient.post<Order>('/orders', data),

    listOrders: (params?: { categoryId?: string; status?: string; limit?: number }) =>
        apiClient.get<OrdersResponse>('/orders', { params }),

    searchOrders: (query: string) =>
        apiClient.get<OrdersResponse>(`/orders/search?q=${query}`),

    getOrder: (orderId: string) =>
        apiClient.get<Order>(`/orders/${orderId}`),

    updateOrder: (orderId: string, data: Partial<CreateOrderRequest>) =>
        apiClient.put<Order>(`/orders/${orderId}`, data),

    deleteOrder: (orderId: string) =>
        apiClient.delete(`/orders/${orderId}`),

    uploadOrderFile: (orderId: string, fileData: any) =>
        apiClient.post(`/orders/${orderId}/files`, fileData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),

    manageOrder: (orderId: string, action: 'PAUSE' | 'RESUME' | 'ARCHIVE') =>
        apiClient.post<{ order: Order }>(`/orders/${orderId}/manage`, { action }),

    completeWork: (orderId: string) =>
        apiClient.post<{ order: Order }>(`/orders/${orderId}/complete`, { action: 'COMPLETE_WORK' }),

    confirmCompletion: (orderId: string, rating: number, comment?: string, isAnonymous?: boolean) =>
        apiClient.post<{ order: Order; review: Review }>(`/orders/${orderId}/complete`, {
            action: 'CONFIRM_COMPLETION',
            rating,
            comment,
            isAnonymous
        }),

    createDirectOrder: (data: CreateOrderRequest & { masterId: string }) =>
        apiClient.post<Order>('/orders/direct', data),
};
