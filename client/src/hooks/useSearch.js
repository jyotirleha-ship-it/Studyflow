import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Custom hook for searching through arrays or managing debounced search terms.
 * Employs useState, useEffect, useMemo, and useRef.
 */
export const useSearch = (items = [], searchKeys = ['name', 'title'], debounceMs = 250) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, debounceMs]);

  const filteredItems = useMemo(() => {
    if (!debouncedTerm.trim() || !items) return items || [];

    const query = debouncedTerm.toLowerCase().trim();

    return items.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(query);
        }
        if (Array.isArray(val)) {
          return val.some(v => typeof v === 'string' && v.toLowerCase().includes(query));
        }
        return false;
      });
    });
  }, [items, debouncedTerm, searchKeys]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    filteredItems,
    clearSearch,
    isSearching: Boolean(debouncedTerm.trim())
  };
};

export default useSearch;
