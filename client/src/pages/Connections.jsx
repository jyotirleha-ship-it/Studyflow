import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { connectionAPI } from '../services/api.js';
import { useStudyPartners } from '../hooks/useStudyPartners.js';
import { usePagination } from '../hooks/usePagination.js';
import { useSearch } from '../hooks/useSearch.js';
import { useFilter } from '../hooks/useFilter.js';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import FilterPanel from '../components/FilterPanel/FilterPanel.jsx';
import './connections.css';

const Connections = () => {
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'search' | 'requests'
  const [searchDirectory, setSearchDirectory] = useState([]);
  const [searchingLoading, setSearchingLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const {
    connected,
    pendingIncoming,
    pendingOutgoing,
    loading: partnersLoading,
    totalPartnersCount,
    pendingRequestsCount,
    fetchConnections,
    sendRequest,
    acceptRequest,
    rejectRequest
  } = useStudyPartners();

  // Search through connected partners
  const {
    searchTerm: partnerSearch,
    setSearchTerm: setPartnerSearch,
    filteredItems: searchedPartners
  } = useSearch(connected, ['partner.name', 'partner.department', 'partner.interestedSubjects']);

  // Filters for connected partners
  const {
    filters: partnerFilters,
    updateFilter: updatePartnerFilter,
    resetFilters: resetPartnerFilters,
    filteredItems: filteredPartners,
    activeFilterCount: partnerFilterCount
  } = useFilter(searchedPartners, { department: 'all', performanceLevel: 'all' });

  // Pagination for partners list
  const {
    currentPage: partnerPage,
    pageSize: partnerPageSize,
    totalPages: partnerTotalPages,
    totalItems: partnerTotalItems,
    pageData: paginatedPartners,
    goToPage: goPartnerPage,
    setPageSize: setPartnerPageSize
  } = usePagination(filteredPartners, 6);

  // Directory Search
  const [dirQuery, setDirQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const executeDirectorySearch = useCallback(async () => {
    setSearchingLoading(true);
    try {
      const params = {};
      if (dirQuery) params.q = dirQuery;
      if (selectedDept !== 'all') params.department = selectedDept;

      const res = await connectionAPI.searchStudents(params);
      if (res.data?.success) {
        setSearchDirectory(res.data.students || []);
      }
    } catch (err) {
      console.error('Directory search failed', err);
    } finally {
      setSearchingLoading(false);
    }
  }, [dirQuery, selectedDept]);

  useEffect(() => {
    if (activeTab === 'search') {
      executeDirectorySearch();
    }
  }, [activeTab, executeDirectorySearch]);

  const handleSendRequest = async (recipientId) => {
    setActionMessage('');
    const res = await sendRequest(recipientId);
    if (res.success) {
      setActionMessage('Connection request dispatched!');
      executeDirectorySearch();
    } else {
      setActionMessage(res.message);
    }
  };

  const handleAccept = async (connId) => {
    const res = await acceptRequest(connId);
    if (res.success) {
      setActionMessage('Study Partner connected! 🎉');
    }
  };

  const handleReject = async (connId) => {
    const res = await rejectRequest(connId);
    if (res.success) {
      setActionMessage('Connection request declined.');
    }
  };

  const departmentFilterConfigs = [
    {
      key: 'department',
      label: 'Department',
      options: [
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'Information Technology', value: 'Information Technology' },
        { label: 'Electronics', value: 'Electronics' }
      ]
    },
    {
      key: 'performanceLevel',
      label: 'Performance Tier',
      options: [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Needs Attention', value: 'Needs Attention' }
      ]
    }
  ];

  return (
    <div className="connections-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="connections-page-title">
            <Users size={28} className="text-primary" /> Study Partners & Peer Network
          </h1>
          <p className="connections-subtitle">
            Connect with classmates, form study cohorts, share curriculum notes, and learn together.
          </p>
        </div>

        <Link to="/recommendations" className="btn btn-primary btn-matches-link">
          <Sparkles size={16} />
          <span>View AI Partner Matches</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {actionMessage && (
        <div className="action-notification-banner">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="btn-close-banner">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="connections-tabs-bar">
        <button
          className={`connections-tab-btn ${activeTab === 'partners' ? 'active' : ''}`}
          onClick={() => setActiveTab('partners')}
        >
          <UserCheck size={16} />
          <span>My Study Partners</span>
          <span className="tab-pill">{totalPartnersCount}</span>
        </button>

        <button
          className={`connections-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Clock size={16} />
          <span>Requests</span>
          {pendingRequestsCount > 0 && <span className="tab-pill pending">{pendingRequestsCount}</span>}
        </button>

        <button
          className={`connections-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} />
          <span>Find Students</span>
        </button>
      </div>

      {/* TAB 1: CONNECTED STUDY PARTNERS */}
      {activeTab === 'partners' && (
        <div className="tab-section-content">
          <div className="filters-and-search-row">
            <SearchBar
              value={partnerSearch}
              onChange={setPartnerSearch}
              placeholder="Search partner by name or subject..."
            />
            <FilterPanel
              filterConfigs={departmentFilterConfigs}
              activeFilters={partnerFilters}
              onFilterChange={updatePartnerFilter}
              onReset={resetPartnerFilters}
              activeCount={partnerFilterCount}
            />
          </div>

          {partnersLoading ? (
            <div className="loading-state-box">Loading study partners...</div>
          ) : filteredPartners.length === 0 ? (
            <div className="empty-state-card glass-card">
              <Users size={48} className="empty-icon" />
              <h3>No Study Partners Connected Yet</h3>
              <p>Search for classmates or check out AI-recommended study partners to build your study network.</p>
              <div className="empty-actions">
                <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                  <UserPlus size={15} /> Find Students
                </button>
                <Link to="/recommendations" className="btn btn-secondary">
                  <Sparkles size={15} /> View Matches
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="partners-grid">
                {paginatedPartners.map(({ connectionId, partner, connectedSince }) => (
                  <div key={connectionId} className="partner-card glass-card">
                    <div className="partner-card-header">
                      <div className="partner-avatar-circle">
                        {partner.name ? partner.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="partner-meta">
                        <h4>{partner.name}</h4>
                        <span className="partner-dept">
                          {partner.department || 'Computer Science'} • {partner.year || '3rd Year'}
                        </span>
                      </div>
                      <span className="connected-badge">
                        <CheckCircle2 size={13} /> Partner
                      </span>
                    </div>

                    <div className="partner-details">
                      <div className="detail-row">
                        <span className="detail-label">Study Pace:</span>
                        <span className="detail-val">{partner.studyHoursPerDay || 3} hrs/day</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Performance:</span>
                        <span className="badge badge-low">{partner.performanceLevel || 'Medium'}</span>
                      </div>
                    </div>

                    <div className="partner-subjects-tags">
                      <span className="tags-label">Interests:</span>
                      <div className="tags-wrap">
                        {(partner.interestedSubjects || ['DBMS', 'Java']).map((subj, idx) => (
                          <span key={idx} className="subject-pill">{subj}</span>
                        ))}
                      </div>
                    </div>

                    <div className="partner-card-footer">
                      <Link to="/shared-notes" className="btn btn-secondary btn-sm">
                        <BookOpen size={13} /> Shared Notes
                      </Link>
                      <Link to="/study-groups" className="btn btn-primary btn-sm">
                        <GraduationCap size={13} /> Cohorts
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={partnerPage}
                totalPages={partnerTotalPages}
                totalItems={partnerTotalItems}
                pageSize={partnerPageSize}
                onPageChange={goPartnerPage}
                onPageSizeChange={setPartnerPageSize}
              />
            </>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING & OUTGOING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="tab-section-content">
          <div className="requests-sections-grid">
            {/* Incoming Requests */}
            <div className="glass-card requests-box">
              <h3 className="requests-box-title">
                Incoming Connection Requests ({pendingIncoming.length})
              </h3>
              {pendingIncoming.length === 0 ? (
                <div className="no-requests-msg">No pending requests waiting for your response.</div>
              ) : (
                <div className="requests-list">
                  {pendingIncoming.map(({ connectionId, partner, sentAt }) => (
                    <div key={connectionId} className="request-item-card">
                      <div className="request-item-info">
                        <div className="partner-avatar-circle small">
                          {partner.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <strong>{partner.name}</strong>
                          <div className="text-muted text-xs">
                            {partner.department} • {partner.year}
                          </div>
                        </div>
                      </div>

                      <div className="request-item-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAccept(connectionId)}
                        >
                          <CheckCircle2 size={14} /> Accept
                        </button>
                        <button
                          className="btn btn-secondary btn-sm btn-reject"
                          onClick={() => handleReject(connectionId)}
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="glass-card requests-box">
              <h3 className="requests-box-title">
                Sent Requests ({pendingOutgoing.length})
              </h3>
              {pendingOutgoing.length === 0 ? (
                <div className="no-requests-msg">No outgoing requests currently waiting.</div>
              ) : (
                <div className="requests-list">
                  {pendingOutgoing.map(({ connectionId, partner, sentAt }) => (
                    <div key={connectionId} className="request-item-card">
                      <div className="request-item-info">
                        <div className="partner-avatar-circle small">
                          {partner.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <strong>{partner.name}</strong>
                          <div className="text-muted text-xs">
                            {partner.department} • Sent {new Date(sentAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-medium">Pending Response</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIND STUDENTS (DIRECTORY SEARCH) */}
      {activeTab === 'search' && (
        <div className="tab-section-content">
          <div className="directory-search-bar-row">
            <SearchBar
              value={dirQuery}
              onChange={setDirQuery}
              placeholder="Search classmates by name, email, department, or subject..."
            />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="dept-select-box"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>

          {searchingLoading ? (
            <div className="loading-state-box">Searching student directory...</div>
          ) : searchDirectory.length === 0 ? (
            <div className="empty-state-card glass-card">
              <Search size={40} className="empty-icon" />
              <h3>No Students Found</h3>
              <p>Try searching for a different keyword or department.</p>
            </div>
          ) : (
            <div className="partners-grid">
              {searchDirectory.map((student) => (
                <div key={student._id} className="partner-card glass-card">
                  <div className="partner-card-header">
                    <div className="partner-avatar-circle">
                      {student.name?.charAt(0) || 'S'}
                    </div>
                    <div className="partner-meta">
                      <h4>{student.name}</h4>
                      <span className="partner-dept">
                        {student.department} • {student.year}
                      </span>
                    </div>
                  </div>

                  <div className="partner-details">
                    <div className="detail-row">
                      <span className="detail-label">Study Commitment:</span>
                      <span className="detail-val">{student.studyHoursPerDay || 3} hrs/day</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Target Goals:</span>
                      <span className="detail-val truncate">{student.studyGoals || 'Core Mastery'}</span>
                    </div>
                  </div>

                  <div className="partner-subjects-tags">
                    <span className="tags-label">Interests:</span>
                    <div className="tags-wrap">
                      {(student.interestedSubjects || ['DBMS', 'Java']).map((subj, idx) => (
                        <span key={idx} className="subject-pill">{subj}</span>
                      ))}
                    </div>
                  </div>

                  <div className="partner-card-footer">
                    {student.connectionStatus === 'connected' ? (
                      <span className="connected-badge">
                        <CheckCircle2 size={13} /> Connected
                      </span>
                    ) : student.connectionStatus === 'pending_sent' ? (
                      <span className="badge badge-medium">Request Sent</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm btn-block"
                        onClick={() => handleSendRequest(student._id)}
                      >
                        <UserPlus size={14} /> Send Connection Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Connections;
