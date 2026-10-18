import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing client-side and server-side pagination.
 * Employs useState, useMemo, and useCallback.
 */
export const usePagination = (items = [], initialPageSize = 8) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items ? items.length : 0;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Adjust current page if total pages drops below current page
  const safeCurrentPage = useMemo(() => {
    if (currentPage > totalPages) return totalPages;
    if (currentPage < 1) return 1;
    return currentPage;
  }, [currentPage, totalPages]);

  const pageData = useMemo(() => {
    if (!items || items.length === 0) return [];
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safeCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pageData,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: safeCurrentPage < totalPages,
    hasPrevPage: safeCurrentPage > 1
  };
};

export default usePagination;
