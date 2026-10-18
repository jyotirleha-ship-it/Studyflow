import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing multi-field filtering over datasets.
 * Employs useState, useMemo, and useCallback.
 */
export const useFilter = (items = [], initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      return Object.entries(filters).every(([key, filterVal]) => {
        if (!filterVal || filterVal === 'all' || filterVal === '') return true;

        const itemVal = item[key];
        if (itemVal === undefined || itemVal === null) return false;

        if (typeof itemVal === 'string') {
          return itemVal.toLowerCase() === String(filterVal).toLowerCase();
        }

        if (Array.isArray(itemVal)) {
          return itemVal.some(val => String(val).toLowerCase() === String(filterVal).toLowerCase());
        }

        if (typeof itemVal === 'boolean') {
          return itemVal === (filterVal === 'true' || filterVal === true);
        }

        return itemVal === filterVal;
      });
    });
  }, [items, filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([_, val]) => val && val !== 'all' && val !== '').length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredItems,
    activeFilterCount
  };
};

export default useFilter;
