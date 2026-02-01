/**
 * Localization API Service
 * Сервис для управления переводами
 */

import api from './api';

export interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  category?: string;
  description?: string;
  pluralForms?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalizationStats {
  totalKeys: number;
  locales: {
    [locale: string]: {
      translated: number;
      missing: number;
      percentage: number;
    };
  };
  categories: {
    [category: string]: {
      total: number;
      translated: Record<string, number>;
    };
  };
}

export interface GetTranslationsParams {
  locale?: string;
  keys?: string[];
  category?: string;
}

export interface SaveTranslationParams {
  key: string;
  locale: string;
  value: string;
  category?: string;
  description?: string;
  pluralForms?: Record<string, string>;
}

export const localizationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTranslations: builder.query<Record<string, string>, GetTranslationsParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.locale) queryParams.append('locale', params.locale);
        if (params.keys) queryParams.append('keys', params.keys.join(','));
        if (params.category) queryParams.append('category', params.category);
        
        return `/localization/translations?${queryParams.toString()}`;
      },
      transformResponse: (response: any) => response.translations || response,
    }),

    getLocalizationStats: builder.query<LocalizationStats, void>({
      query: () => '/localization/stats',
    }),

    saveTranslation: builder.mutation<Translation, SaveTranslationParams>({
      query: (translation) => ({
        url: '/localization/translations',
        method: 'POST',
        body: translation,
      }),
      transformResponse: (response: any) => response.translation,
    }),

    deleteTranslation: builder.mutation<void, { key: string; locale: string }>({
      query: ({ key, locale }) => ({
        url: `/localization/translations/${locale}/${key}`,
        method: 'DELETE',
      }),
    }),

    importTranslations: builder.mutation<void, { locale: string; translations: Record<string, string> }>({
      query: (data) => ({
        url: '/localization/import',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetTranslationsQuery,
  useGetLocalizationStatsQuery,
  useSaveTranslationMutation,
  useDeleteTranslationMutation,
  useImportTranslationsMutation,
} = localizationApi;
