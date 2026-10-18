import React, { useState, useEffect, useCallback } from 'react';
import {
  MessagesSquare,
  Plus,
  Users,
  BookOpen,
  Bell,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { groupAPI } from '../services/api.js';
import { useSearch } from '../hooks/useSearch.js';
import { useFilter } from '../hooks/useFilter.js';
import { usePagination } from '../hooks/usePagination.js';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import FilterPanel from '../components/FilterPanel/FilterPanel.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import './studyGroups.css';

const StudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // New Group Form State
  const [formData, setFormData] = useState({
    name: '',
    subject: 'DBMS',
    description: ''
  });
  const [formError, setFormError] = useState('');

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupAPI.getGroups();
      if (res.data?.success) {
        setGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load study groups', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Search hook
  const {
    searchTerm,
    setSearchTerm,
    filteredItems: searchedGroups
  } = useSearch(groups, ['name', 'subject', 'description']);

  // Filter hook
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems,
    activeFilterCount
  } = useFilter(searchedGroups, { subject: 'all' });

  // Pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageData: paginatedGroups,
    goToPage,
    setPageSize
  } = usePagination(filteredItems, 6);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim()) {
      setFormError('Please enter both group name and subject');
      return;
    }

    try {
      const res = await groupAPI.createGroup(formData);
      if (res.data?.success) {
        setIsModalOpen(false);
        setFormData({ name: '', subject: 'DBMS', description: '' });
        setFormError('');
        setActionNotice(`Group "${res.data.group.name}" created successfully!`);
        fetchGroups();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId, groupName) => {
    try {
      const res = await groupAPI.joinGroup(groupId);
      if (res.data?.success) {
        setActionNotice(`Joined ${groupName}!`);
        fetchGroups();
      }
    } catch (err) {
      setActionNotice(err.response?.data?.message || 'Failed to join group');
    }
  };

  const subjectFilterConfigs = [
    {
      key: 'subject',
      label: 'Subject',
      options: [
        { label: 'DBMS', value: 'DBMS' },
        { label: 'Java', value: 'Java' },
        { label: 'Placement', value: 'Placement' },
        { label: 'Blockchain', value: 'Blockchain' }
      ]
    }
  ];

  return (
    <div className="study-groups-page-container">
      {/* Header */}
      <div className="study-groups-header">
        <div>
          <h1 className="study-groups-title">
            <MessagesSquare size={28} className="text-primary" /> Study Groups & Cohorts
          </h1>
          <p className="study-groups-subtitle">
            Collaborate on specific subjects, engage in group discussions, publish announcements, and review peer notes.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Create Study Group</span>
        </button>
      </div>

      {actionNotice && (
        <div className="action-notification-banner">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="btn-close-banner">✕</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="groups-toolbar-row">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search group name, topic or description..."
        />
        <FilterPanel
          filterConfigs={subjectFilterConfigs}
          activeFilters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="loading-state-box">Loading study groups...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state-card glass-card">
          <MessagesSquare size={48} className="empty-icon" />
          <h3>No Study Groups Found</h3>
          <p>Be the first to initiate a study group for your curriculum.</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} /> Create First Cohort
          </button>
        </div>
      ) : (
        <>
          <div className="study-groups-grid">
            {paginatedGroups.map((group) => (
              <div key={group._id} className="study-group-card glass-card">
                <div className="group-card-header">
                  <div className="group-subject-badge">
                    {group.subject}
                  </div>
                  {group.isMember && (
                    <span className="member-status-pill">
                      <CheckCircle2 size={12} /> Member
                    </span>
                  )}
                </div>

                <div className="group-info">
                  <h3 className="group-name">{group.name}</h3>
                  <p className="group-description">
                    {group.description || `Study cohort dedicated to ${group.subject} concepts and problem solving.`}
                  </p>
                </div>

                {/* Latest Announcement Preview */}
                {group.announcements && group.announcements.length > 0 && (
                  <div className="group-announcement-snippet">
                    <div className="announcement-badge">
                      <Bell size={12} /> Announcement:
                    </div>
                    <p className="announcement-text">
                      "{group.announcements[0].title}"
                    </p>
                  </div>
                )}

                <div className="group-meta-stats">
                  <div className="meta-stat">
                    <Users size={14} className="text-muted" />
                    <span><strong>{group.memberCount}</strong> Members</span>
                  </div>
                  <div className="meta-stat">
                    <BookOpen size={14} className="text-muted" />
                    <span>Curriculum: <strong>{group.subject}</strong></span>
                  </div>
                </div>

                <div className="group-card-footer">
                  {group.isMember ? (
                    <Link to={`/group-chat/${group._id}`} className="btn btn-primary btn-block">
                      <MessageCircle size={15} /> Enter Group Chat
                    </Link>
                  ) : (
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={() => handleJoinGroup(group._id, group.name)}
                    >
                      <Users size={15} /> Join Group
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Study Group">
        <form onSubmit={handleCreateGroup} className="create-group-form">
          {formError && <div className="form-error-alert">{formError}</div>}

          <div className="form-field-group">
            <label>Group Name *</label>
            <input
              type="text"
              placeholder="e.g. DBMS Group, Java Group, Placement Group..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Subject Domain *</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <option value="DBMS">DBMS (Database Management Systems)</option>
              <option value="Java">Java & Object-Oriented Design</option>
              <option value="Placement">Campus Placement & Aptitude</option>
              <option value="Blockchain">Blockchain & Cryptography</option>
              <option value="Data Structures">Data Structures & Algorithms</option>
              <option value="Operating Systems">Operating Systems</option>
            </select>
          </div>

          <div className="form-field-group">
            <label>Description & Goals</label>
            <textarea
              rows="3"
              placeholder="What topics will this group focus on? (e.g. Normalization, LeetCode practice, exam prep)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Group
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudyGroups;
