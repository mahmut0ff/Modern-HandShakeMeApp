import { useState, useMemo } from 'react';
import {
  applyFilters,
  applySorting,
  applySearch,
  paginateItems,
} from '../utils/filterHelpers';

interface UseFiltersOptions<T> {
  initialFilters?: Partial<T>;
  initialSortBy?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  pageSize?: number;
  searchFields?: (keyof T)[];
}

export const useFilters = <T extends Record<string, any>>(
  data: T[],
  options: UseFiltersOptions<T> = {}
) => {
  const {
    initialFilters = {},
    initialSortBy,
    initialSortDirection = 'asc',
    pageSize = 10,
    searchFields = [],
  } = options;

  const [filters, setFilters] = useState<Partial<T>>(initialFilters);
  const [sortBy, setSortBy] = useState<keyof T | undefined>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery && searchFields.length > 0) {
      result = applySearch(result, searchQuery, searchFields);
    }

    // Apply filters
    result = applyFilters(result, filters);

    // Apply sorting
    if (sortBy) {
      result = applySorting(result, sortBy as string, sortDirection);
    }

    return result;
  }, [data, filters, sortBy, sortDirection, searchQuery, searchFields]);

  const paginatedData = useMemo(() => {
    return paginateItems(filteredData, currentPage, pageSize);
  }, [filteredData, currentPage, pageSize]);

  const updateFilter = (key: keyof T, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const updateSort = (field: keyof T) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const updateSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return {
    // Data
    filteredData,
    paginatedData: paginatedData.items,
    totalPages: paginatedData.totalPages,
    totalItems: filteredData.length,

    // State
    filters,
    sortBy,
    sortDirection,
    searchQuery,
    currentPage,

    // Actions
    updateFilter,
    clearFilters,
    updateSort,
    updateSearch,
    setCurrentPage,
  };
};
