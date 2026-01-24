export interface FilterOption<T = string> {
  label: string;
  value: T;
}

export interface SortOption<T = string> {
  label: string;
  value: T;
  direction: 'asc' | 'desc';
}

export const applyFilters = <T extends Record<string, any>>(
  items: T[],
  filters: Record<string, any>
): T[] => {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }

      if (Array.isArray(value)) {
        return value.length === 0 || value.includes(item[key]);
      }

      if (typeof value === 'string') {
        return String(item[key]).toLowerCase().includes(value.toLowerCase());
      }

      return item[key] === value;
    });
  });
};

export const applySorting = <T extends Record<string, any>>(
  items: T[],
  sortBy: string,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

export const applySearch = <T extends Record<string, any>>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchQuery.trim()) return items;

  const query = searchQuery.toLowerCase();

  return items.filter((item) => {
    return searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(query);
    });
  });
};

export const paginateItems = <T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number } => {
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    totalPages,
  };
};

export const createFilterState = <T extends Record<string, any>>(
  initialFilters: Partial<T> = {}
): T => {
  return initialFilters as T;
};

export const resetFilters = <T extends Record<string, any>>(
  filters: T,
  keysToReset?: (keyof T)[]
): T => {
  if (!keysToReset) {
    return Object.keys(filters).reduce((acc, key) => {
      acc[key as keyof T] = null as any;
      return acc;
    }, {} as T);
  }

  return {
    ...filters,
    ...keysToReset.reduce((acc, key) => {
      acc[key] = null as any;
      return acc;
    }, {} as Partial<T>),
  };
};
