/**
 * useLocalizationManagement Hook
 * Хук для управления переводами
 */

import { useState, useCallback } from 'react';
import {
  useGetTranslationsQuery,
  useGetLocalizationStatsQuery,
  useSaveTranslationMutation,
  useDeleteTranslationMutation,
  useImportTranslationsMutation,
} from '../services/localizationApi';

export interface UseLocalizationManagementOptions {
  locale?: string;
  category?: string;
  autoRefresh?: boolean;
}

export const useLocalizationManagement = (options: UseLocalizationManagementOptions = {}) => {
  const { locale = 'ru', category, autoRefresh = false } = options;

  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);

  // Queries
  const {
    data: translations,
    isLoading: translationsLoading,
    refetch: refetchTranslations,
  } = useGetTranslationsQuery(
    {
      locale: selectedLocale,
      category: selectedCategory,
    },
    {
      pollingInterval: autoRefresh ? 30000 : undefined, // Auto-refresh every 30s if enabled
    }
  );

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetLocalizationStatsQuery(undefined, {
    pollingInterval: autoRefresh ? 60000 : undefined, // Auto-refresh every 60s if enabled
  });

  // Mutations
  const [saveTranslation, { isLoading: isSaving }] = useSaveTranslationMutation();
  const [deleteTranslation, { isLoading: isDeleting }] = useDeleteTranslationMutation();
  const [importTranslations, { isLoading: isImporting }] = useImportTranslationsMutation();

  // Handlers
  const handleSaveTranslation = useCallback(
    async (data: {
      key: string;
      locale: string;
      value: string;
      category?: string;
      description?: string;
    }) => {
      try {
        await saveTranslation(data).unwrap();
        await refetchTranslations();
        await refetchStats();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    [saveTranslation, refetchTranslations, refetchStats]
  );

  const handleDeleteTranslation = useCallback(
    async (key: string, locale: string) => {
      try {
        await deleteTranslation({ key, locale }).unwrap();
        await refetchTranslations();
        await refetchStats();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    [deleteTranslation, refetchTranslations, refetchStats]
  );

  const handleImportTranslations = useCallback(
    async (locale: string, translations: Record<string, string>) => {
      try {
        await importTranslations({ locale, translations }).unwrap();
        await refetchTranslations();
        await refetchStats();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    [importTranslations, refetchTranslations, refetchStats]
  );

  const changeLocale = useCallback((newLocale: string) => {
    setSelectedLocale(newLocale);
  }, []);

  const changeCategory = useCallback((newCategory: string | undefined) => {
    setSelectedCategory(newCategory);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refetchTranslations(), refetchStats()]);
  }, [refetchTranslations, refetchStats]);

  // Computed values
  const currentLocaleStats = stats?.locales?.[selectedLocale];
  const completionPercentage = currentLocaleStats?.percentage || 0;
  const translatedCount = currentLocaleStats?.translated || 0;
  const missingCount = currentLocaleStats?.missing || 0;

  return {
    // Data
    translations,
    stats,
    selectedLocale,
    selectedCategory,
    currentLocaleStats,
    completionPercentage,
    translatedCount,
    missingCount,

    // Loading states
    isLoading: translationsLoading || statsLoading,
    isSaving,
    isDeleting,
    isImporting,

    // Actions
    saveTranslation: handleSaveTranslation,
    deleteTranslation: handleDeleteTranslation,
    importTranslations: handleImportTranslations,
    changeLocale,
    changeCategory,
    refresh,
  };
};

export default useLocalizationManagement;
