import React from 'react';
import { Search, X } from 'lucide-react';
import './searchBar.css';

const SearchBar = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search by name, subject, or keyword...',
  className = '',
  autoFocus = false
}) => {
  return (
    <div className={`studyflow-search-bar ${className}`}>
      <Search className="search-icon" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={onClear || (() => onChange(''))}
          className="search-clear-btn"
          aria-label="Clear search query"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
