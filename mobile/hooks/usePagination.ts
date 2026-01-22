import { useState, useCallback, useMemo } from 'react';

export interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  reset: () => void;
}

export interface UsePaginationReturn {
  state: PaginationState;
  actions: PaginationActions;
}

export const usePagination = ({
  initialPage = 1,
  pageSize: initialPageSize = 20,
  totalCount: initialTotalCount = 0,
}: PaginationConfig = {}): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const state: PaginationState = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      isFirstPage,
      isLastPage,
    };
  }, [currentPage, pageSize, totalCount]);

  const actions: PaginationActions = useMemo(() => ({
    goToPage: useCallback((page: number) => {
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    }, [totalCount, pageSize]),

    nextPage: useCallback(() => {
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalCount, pageSize]),

    previousPage: useCallback(() => {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []),

    goToFirstPage: useCallback(() => {
      setCurrentPage(1);
    }, []),

    goToLastPage: useCallback(() => {
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      setCurrentPage(totalPages);
    }, [totalCount, pageSize]),

    setPageSize: useCallback((size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when changing page size
    }, []),

    setTotalCount: useCallback((count: number) => {
      setTotalCount(count);
      // Adjust current page if it's now out of bounds
      const totalPages = Math.ceil(count / pageSize) || 1;
      setCurrentPage(prev => Math.min(prev, totalPages));
    }, [pageSize]),

    reset: useCallback(() => {
      setCurrentPage(initialPage);
      setPageSize(initialPageSize);
      setTotalCount(initialTotalCount);
    }, [initialPage, initialPageSize, initialTotalCount]),
  }), [totalCount, pageSize, initialPage, initialPageSize, initialTotalCount]);

  return { state, actions };
};

// Hook for infinite scroll pagination
export interface UseInfiniteScrollConfig {
  pageSize?: number;
  threshold?: number; // How close to the end before loading more
}

export interface UseInfiniteScrollReturn {
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useInfiniteScroll = ({
  pageSize = 20,
  threshold = 0.8,
}: UseInfiniteScrollConfig = {}): UseInfiniteScrollReturn => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
  }, []);

  return {
    page,
    pageSize,
    hasMore,
    isLoading,
    loadMore,
    reset,
    setLoading: setIsLoading,
    setHasMore,
  };
};

// Utility functions for pagination
export const getPaginationInfo = (
  currentPage: number,
  pageSize: number,
  totalCount: number
) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    startItem,
    endItem,
    totalPages,
    showing: `${startItem}-${endItem} из ${totalCount}`,
  };
};

export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | '...')[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(1);

  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if we're near the beginning
  if (currentPage <= halfVisible + 1) {
    endPage = Math.min(totalPages - 1, maxVisible - 1);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    startPage = Math.max(2, totalPages - maxVisible + 2);
  }

  // Add ellipsis after first page if needed
  if (startPage > 2) {
    pages.push('...');
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (endPage < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page (if more than 1 page)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

export default usePagination;