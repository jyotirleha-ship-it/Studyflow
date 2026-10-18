import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import './filterPanel.css';

const FilterPanel = ({
  filterConfigs = [],
  activeFilters = {},
  onFilterChange,
  onReset,
  activeCount = 0,
  className = ''
}) => {
  return (
    <div className={`studyflow-filter-panel ${className}`}>
      <div className="filter-header">
        <div className="filter-title">
          <Filter size={15} />
          <span>Filters</span>
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="filter-reset-btn" title="Reset all filters">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="filter-items">
        {filterConfigs.map((cfg) => (
          <div key={cfg.key} className="filter-item">
            <label className="filter-label">{cfg.label}</label>
            <select
              value={activeFilters[cfg.key] || 'all'}
              onChange={(e) => onFilterChange(cfg.key, e.target.value)}
              className="filter-select"
            >
              <option value="all">All {cfg.label}</option>
              {cfg.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;
