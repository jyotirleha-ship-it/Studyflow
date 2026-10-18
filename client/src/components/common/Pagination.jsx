import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './pagination.css';

const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        {t('common.page', { current: page, total: totalPages })} ({total} items)
      </div>

      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('common.prev')}
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                className={`page-btn ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            );
          }
          return null;
        })}

        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('common.next')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
