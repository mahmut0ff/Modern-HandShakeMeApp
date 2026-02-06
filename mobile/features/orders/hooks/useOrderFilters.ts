/**
 * useOrderFilters Hook
 * Хук для управления фильтрами заказов
 */

import { useState, useCallback } from 'react';
import type { OrderFiltersState } from '../types';

export function useOrderFilters(initialFilters: OrderFiltersState = {}) {
  const [filters, setFilters] = useState<OrderFiltersState>(initialFilters);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const updateFilters = useCallback((newFilters: OrderFiltersState) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const toggleFiltersModal = useCallback(() => {
    setIsFiltersVisible((prev) => !prev);
  }, []);

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof OrderFiltersState] !== undefined
  ).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    updateFilters,
    resetFilters,
    isFiltersVisible,
    toggleFiltersModal,
    activeFiltersCount,
    hasActiveFilters,
  };
}
