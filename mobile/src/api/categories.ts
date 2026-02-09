import apiClient from './client';

export interface Category {
    id: number;
    name: string;
    icon: string;
    order: number;
}

export interface Skill {
    id: number;
    name: string;
    categoryId: number;
}

export const categoriesApi = {
    listCategories: () =>
        apiClient.get<Category[]>('/categories'),

    getCategorySkills: (categoryId: number) =>
        apiClient.get<Skill[]>(`/categories/${categoryId}/skills`),
};
