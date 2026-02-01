/**
 * useAnalytics Hook
 * Хук для работы с аналитикой
 */

import { useState, useMemo } from 'react';
import {
  useGetMasterAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetFinancialAnalyticsQuery,
} from '../services/analyticsApi';

export type PeriodKey = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: Record<PeriodKey, { label: string; days: number }> = {
  week: { label: 'Неделя', days: 7 },
  month: { label: 'Месяц', days: 30 },
  quarter: { label: 'Квартал', days: 90 },
  year: { label: 'Год', days: 365 },
};

export const useAnalytics = (initialPeriod: PeriodKey = 'month') => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(initialPeriod);

  const dateRange = useMemo(() => {
    const period = PERIODS[selectedPeriod];
    const endDate = new Date();
    const startDate = new Date(Date.now() - period.days * 24 * 60 * 60 * 1000);
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: period.days,
      label: period.label,
    };
  }, [selectedPeriod]);

  const masterAnalytics = useGetMasterAnalyticsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    granularity: 'DAY',
  });

  const orderAnalytics = useGetOrderAnalyticsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const financialAnalytics = useGetFinancialAnalyticsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const isLoading = masterAnalytics.isLoading || orderAnalytics.isLoading || financialAnalytics.isLoading;
  const isError = masterAnalytics.isError || orderAnalytics.isError || financialAnalytics.isError;

  const refetchAll = async () => {
    await Promise.all([
      masterAnalytics.refetch(),
      orderAnalytics.refetch(),
      financialAnalytics.refetch(),
    ]);
  };

  return {
    // Period management
    selectedPeriod,
    setSelectedPeriod,
    dateRange,
    periods: PERIODS,

    // Data
    masterAnalytics: masterAnalytics.data,
    orderAnalytics: orderAnalytics.data,
    financialAnalytics: financialAnalytics.data,

    // Loading states
    isLoading,
    isError,

    // Actions
    refetch: refetchAll,
  };
};

export default useAnalytics;
