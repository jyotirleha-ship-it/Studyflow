import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './pagination.css';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  showPageSizeOptions = false
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="studyflow-pagination">
      <div className="pagination-info">
        Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> -{' '}
        <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> entries
      </div>

      <div className="pagination-controls">
        <button
          className="page-nav-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <div className="page-numbers">
          {pages[0] > 1 && (
            <>
              <button className="page-num-btn" onClick={() => onPageChange(1)}>1</button>
              {pages[0] > 2 && <span className="page-ellipsis">...</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              className={`page-num-btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && <span className="page-ellipsis">...</span>}
              <button className="page-num-btn" onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          className="page-nav-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {showPageSizeOptions && onPageSizeChange && (
        <div className="page-size-selector">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="page-size-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
