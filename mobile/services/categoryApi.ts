import { api } from './api';

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
  category?: number;
}

export interface CategoryWithSkills extends Category {
  skills: Skill[];
  skillsCount: number;
}

export interface SkillsResponse {
  skills: Skill[];
  count: number;
  filters?: {
    categoryId?: number;
    search?: string;
    limit?: number;
  };
}

export interface CategorySkillsResponse {
  category: {
    id: number;
    name: string;
    icon: string;
  };
  skills: Skill[];
  count: number;
}

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List all categories
    listCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),

    // Get category with skills
    getCategorySkills: builder.query<CategorySkillsResponse, number>({
      query: (categoryId) => `/categories/${categoryId}/skills`,
      providesTags: ['Category', 'Skill'],
    }),

    // List all skills with optional filters
    listSkills: builder.query<SkillsResponse, { categoryId?: number; search?: string; limit?: number }>({
      query: (params) => ({
        url: '/skills',
        params,
      }),
      providesTags: ['Skill'],
    }),

    // Search skills
    searchSkills: builder.query<Skill[], string>({
      query: (search) => ({
        url: '/skills',
        params: { search, limit: 50 },
      }),
      transformResponse: (response: SkillsResponse) => response.skills,
      providesTags: ['Skill'],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useGetCategorySkillsQuery,
  useListSkillsQuery,
  useSearchSkillsQuery,
  useLazySearchSkillsQuery,
} = categoryApi;

// Alias for backward compatibility
export const useGetCategoriesQuery = useListCategoriesQuery;
