import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2,
  Lock,
  Users,
  BookOpen,
  Tag,
  Edit3,
  Eye,
  Plus,
  Send,
  CheckCircle2,
  FileText,
  UserCheck,
  Search,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { sharedNotesAPI, notesAPI, subjectAPI } from '../services/api.js';
import { useStudyPartners } from '../hooks/useStudyPartners.js';
import { useSearch } from '../hooks/useSearch.js';
import { useFilter } from '../hooks/useFilter.js';
import { usePagination } from '../hooks/usePagination.js';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import FilterPanel from '../components/FilterPanel/FilterPanel.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import './sharedNotes.css';

const SharedNotes = () => {
  const [activeTab, setActiveTab] = useState('sharedWithMe'); // 'sharedWithMe' | 'sharedByMe' | 'private'
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [sharedByMe, setSharedByMe] = useState([]);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Selected note for viewing / collaborative editing
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', content: '', tags: '' });

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  const { connected } = useStudyPartners();

  const fetchAllNotes = useCallback(async () => {
    setLoading(true);
    try {
      const [sharedRes, privateRes] = await Promise.all([
        sharedNotesAPI.getSharedNotes(),
        notesAPI.getNotes()
      ]);

      if (sharedRes.data?.success) {
        setSharedWithMe(sharedRes.data.sharedWithMe || []);
        setSharedByMe(sharedRes.data.sharedByMe || []);
      }
      if (privateRes.data?.notes) {
        setPrivateNotes(privateRes.data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  // Current active list
  const currentList = activeTab === 'sharedWithMe'
    ? sharedWithMe
    : activeTab === 'sharedByMe'
      ? sharedByMe
      : privateNotes;

  // Search
  const {
    searchTerm,
    setSearchTerm,
    filteredItems: searchedNotes
  } = useSearch(currentList, ['title', 'content', 'subject', 'topic']);

  // Filters
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems,
    activeFilterCount
  } = useFilter(searchedNotes, { subject: 'all' });

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageData: paginatedNotes,
    goToPage,
    setPageSize
  } = usePagination(filteredItems, 6);

  // Edit / Save Note Handler
  const handleOpenEdit = (note) => {
    setSelectedNote(note);
    setEditFormData({
      title: note.title,
      content: note.content,
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedNote) return;

    try {
      const res = await sharedNotesAPI.updateSharedNote(selectedNote._id || selectedNote.id, editFormData);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        setActionNotice('Note saved and synchronized with study partners!');
        fetchAllNotes();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update shared note');
    }
  };

  // Share Note Modal Handlers
  const handleOpenShare = (note) => {
    setNoteToShare(note);
    setSelectedPartnerId(connected[0]?.partner?._id || '');
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async (e) => {
    e.preventDefault();
    if (!noteToShare || !selectedPartnerId) return;

    try {
      const res = await sharedNotesAPI.shareNote(noteToShare._id || noteToShare.id, {
        recipientIds: [selectedPartnerId]
      });
      if (res.data?.success) {
        setIsShareModalOpen(false);
        setActionNotice(`Note shared with partner!`);
        fetchAllNotes();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to share note');
    }
  };

  const subjectFilterConfigs = [
    {
      key: 'subject',
      label: 'Subject',
      options: [
        { label: 'DBMS', value: 'DBMS' },
        { label: 'Java', value: 'Java' },
        { label: 'Database Management Systems', value: 'Database Management Systems' },
        { label: 'Placement', value: 'Placement' },
        { label: 'Blockchain', value: 'Blockchain' }
      ]
    }
  ];

  return (
    <div className="shared-notes-page-container">
      {/* Header */}
      <div className="shared-notes-header">
        <div>
          <h1 className="shared-notes-title">
            <Share2 size={28} className="text-primary" /> Collaborative Shared Notes
          </h1>
          <p className="shared-notes-subtitle">
            Upload, share, edit, and access peer study notes across connected partners and study groups.
          </p>
        </div>

        <Link to="/notes" className="btn btn-secondary">
          <Edit3 size={15} />
          <span>My Notes Workspace</span>
        </Link>
      </div>

      {actionNotice && (
        <div className="action-notification-banner">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="btn-close-banner">✕</button>
        </div>
      )}

      {/* Tabs: Private vs Shared */}
      <div className="shared-notes-tabs-bar">
        <button
          className={`notes-tab-btn ${activeTab === 'sharedWithMe' ? 'active' : ''}`}
          onClick={() => setActiveTab('sharedWithMe')}
        >
          <Share2 size={16} />
          <span>Shared With Me</span>
          <span className="tab-pill">{sharedWithMe.length}</span>
        </button>

        <button
          className={`notes-tab-btn ${activeTab === 'sharedByMe' ? 'active' : ''}`}
          onClick={() => setActiveTab('sharedByMe')}
        >
          <UserCheck size={16} />
          <span>Shared By Me</span>
          <span className="tab-pill">{sharedByMe.length}</span>
        </button>

        <button
          className={`notes-tab-btn ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          <Lock size={16} />
          <span>Private Notes</span>
          <span className="tab-pill">{privateNotes.length}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="notes-toolbar-row">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by note title, subject, topic, or content..."
        />
        <FilterPanel
          filterConfigs={subjectFilterConfigs}
          activeFilters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="loading-state-box">Loading notes...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state-card glass-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>No Notes in this Category</h3>
          <p>
            {activeTab === 'sharedWithMe'
              ? 'No notes shared with you yet. Connect with study partners or join a study cohort to receive notes.'
              : 'You have not shared any notes yet. Select a private note to share with your partners.'}
          </p>
          {activeTab === 'sharedWithMe' && (
            <Link to="/connections" className="btn btn-primary" style={{ marginTop: '10px' }}>
              <Users size={15} /> Find Study Partners
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="notes-cards-grid">
            {paginatedNotes.map((note) => {
              const sharedByName = note.sharedBy?.name || note.owner?.name || 'Classmate';
              const subjectTitle = typeof note.subject === 'string' ? note.subject : (note.subject?.name || 'General');
              const topicTitle = typeof note.topic === 'string' ? note.topic : (note.topic?.name || 'Overview');

              return (
                <div key={note._id || note.id} className="shared-note-card glass-card">
                  {/* Top Badge: Shared By & Subject */}
                  <div className="note-card-top">
                    <div className="note-subject-pill">
                      <BookOpen size={12} />
                      <span>{subjectTitle}</span>
                    </div>

                    {activeTab !== 'private' ? (
                      <div className="shared-by-pill">
                        <span>Shared By: <strong>{sharedByName}</strong></span>
                      </div>
                    ) : (
                      <span className="private-badge">
                        <Lock size={12} /> Private
                      </span>
                    )}
                  </div>

                  {/* Note Title & Topic */}
                  <div className="note-body-header">
                    <h3 className="note-title">{note.title}</h3>
                    {topicTitle && (
                      <div className="note-topic-badge">
                        Topic: <strong>{topicTitle}</strong>
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div className="note-content-preview">
                    {note.content.substring(0, 180)}...
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="note-tags-wrap">
                      {note.tags.map((t, idx) => (
                        <span key={idx} className="note-tag-chip">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="note-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(note)}
                    >
                      <Eye size={14} /> View & Edit
                    </button>

                    {activeTab === 'private' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenShare(note)}
                      >
                        <Share2 size={14} /> Share
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenEdit(note)}
                      >
                        <Edit3 size={14} /> Collaborate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* View & Edit Shared Note Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedNote ? `Note: ${selectedNote.title}` : 'Edit Note'}
      >
        <form onSubmit={handleSaveEdit} className="edit-note-form">
          <div className="form-field-group">
            <label>Note Title *</label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Note Content (Markdown supported) *</label>
            <textarea
              rows="12"
              value={editFormData.content}
              onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. DBMS, Normalization, BCNF"
              value={editFormData.tags}
              onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
            />
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Synchronize Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Note Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Note with Study Partner"
      >
        <form onSubmit={handleConfirmShare} className="share-note-form">
          <p className="share-modal-desc">
            Choose a connected study partner to grant collaborative reading and editing permissions for:
            <strong> "{noteToShare?.title}"</strong>
          </p>

          <div className="form-field-group">
            <label>Select Connected Partner *</label>
            {connected.length === 0 ? (
              <div className="no-partners-alert">
                You have no connected study partners yet. Please connect with students first in the Study Partners page.
              </div>
            ) : (
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                required
              >
                {connected.map(({ partner }) => (
                  <option key={partner._id} value={partner._id}>
                    {partner.name} ({partner.department || 'Computer Science'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={() => setIsShareModalOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={connected.length === 0 || !selectedPartnerId}
            >
              Confirm & Share Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SharedNotes;
