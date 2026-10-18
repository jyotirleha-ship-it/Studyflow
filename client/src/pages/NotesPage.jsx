import React, { useState, useEffect, useCallback } from 'react';
import {
  FileEdit,
  Plus,
  Search,
  BookOpen,
  Tag,
  Download,
  Trash2,
  Edit3,
  Bot,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { notesAPI, subjectAPI, recentlyAccessedAPI } from '../services/api.js';
import { useChatbot } from '../hooks/useChatbot.js';
import Modal from '../components/common/Modal.jsx';
import { useTranslation } from 'react-i18next';

const NotesPage = () => {
  const { t } = useTranslation();
  const { sendMessage, toggleOpen, isOpen } = useChatbot();

  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    title: '',
    content: '',
    tags: ''
  });
  const [formError, setFormError] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await subjectAPI.getSubjects();
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  const fetchTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      const res = await subjectAPI.getTopics({ subject: subjectId });
      setTopics(res.data.topics || []);
    } catch (err) {
      console.error('Failed to load topics', err);
    }
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSubjectId !== 'all') params.subject = selectedSubjectId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await notesAPI.getNotes(params);
      setNotes(res.data.notes || []);
      if (res.data.notes && res.data.notes.length > 0 && !selectedNote) {
        setSelectedNote(res.data.notes[0]);
      } else if (res.data.notes && res.data.notes.length === 0) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, searchQuery, selectedNote]);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    recentlyAccessedAPI.recordAccess({
      resourceType: 'note',
      resourceId: note._id,
      title: note.title,
      subtitle: `${note.subject?.name || 'General'}${note.topic?.name ? ' • ' + note.topic.name : ''}`,
      path: '/notes'
    }).catch(() => {});
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [selectedSubjectId, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingNoteId(null);
    const initialSubject = selectedSubjectId !== 'all' ? selectedSubjectId : (subjects[0]?._id || '');
    setFormData({
      subject: initialSubject,
      topic: '',
      title: '',
      content: '',
      tags: ''
    });
    fetchTopics(initialSubject);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingNoteId(note._id);
    setFormData({
      subject: note.subject?._id || note.subject || '',
      topic: note.topic?._id || note.topic || '',
      title: note.title,
      content: note.content,
      tags: (note.tags || []).join(', ')
    });
    fetchTopics(note.subject?._id || note.subject);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubjectChangeInForm = (subId) => {
    setFormData(prev => ({ ...prev, subject: subId, topic: '' }));
    fetchTopics(subId);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.subject || !formData.title.trim() || !formData.content.trim()) {
      setFormError('Please choose a subject and provide both title and content.');
      return;
    }

    const payload = {
      subject: formData.subject,
      topic: formData.topic || null,
      title: formData.title.trim(),
      content: formData.content.trim(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (editingNoteId) {
        const res = await notesAPI.updateNote(editingNoteId, payload);
        setSelectedNote(res.data.note);
      } else {
        const res = await notesAPI.createNote(payload);
        setSelectedNote(res.data.note);
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save note.');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesAPI.deleteNote(id);
      if (selectedNote?._id === id) {
        setSelectedNote(null);
      }
      fetchNotes();
    } catch (err) {
      console.error('Delete note failed', err);
    }
  };

  const handleAskMentor = (note) => {
    const promptText = `Explain 2NF and key concepts based on my note "${note.title}" in ${note.subject?.name || 'my subjects'}`;
    sendMessage(promptText);
    if (!isOpen) {
      toggleOpen();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileEdit size={28} color="var(--primary)" /> Personal Study Notes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Curriculum knowledge base deeply connected with your AI Study Mentor
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedSubjectId !== 'all' && (
            <a
              href={notesAPI.exportSubjectNotesPDF(selectedSubjectId)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              title="Download full subject notebook PDF"
            >
              <Download size={16} /> Export Subject Notes PDF
            </a>
          )}
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search notes by title, concept, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            className={`btn ${selectedSubjectId === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setSelectedSubjectId('all')}
          >
            All Subjects
          </button>
          {subjects.map(sub => (
            <button
              key={sub._id}
              className={`btn ${selectedSubjectId === sub._id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedSubjectId(sub._id)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
            <FileText size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No notes yet.</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Create your first note to start building your personal study knowledge base. Your AI Mentor will use these notes to answer questions, generate quizzes, and build revision roadmaps!
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> Create Note
          </button>
        </div>
      )}

      {/* Two-Column Master-Detail Layout */}
      {notes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Notes Sidebar List */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 8px' }}>
              {notes.length} Note(s)
            </div>
            {notes.map(note => {
              const isSelected = selectedNote?._id === note._id;
              return (
                <div
                  key={note._id}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>{note.subject?.name || 'General'}</span>
                    {note.topic?.name && <span>• {note.topic.name}</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note Detail View */}
          {selectedNote && (
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                    <BookOpen size={14} /> {selectedNote.subject?.name || 'Curriculum'} {selectedNote.topic?.name && `→ ${selectedNote.topic.name}`}
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{selectedNote.title}</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    onClick={() => handleAskMentor(selectedNote)}
                    title="Ask StudyFlow Mentor to analyze or quiz you from this note"
                  >
                    <Bot size={15} color="var(--primary)" /> Ask AI Mentor
                  </button>
                  <a
                    href={notesAPI.exportNotePDF(selectedNote._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    title="Download Note as PDF"
                  >
                    <Download size={15} /> PDF
                  </a>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    onClick={() => handleOpenEditModal(selectedNote)}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--accent-rose)' }}
                    onClick={() => handleDeleteNote(selectedNote._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedNote.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={11} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              <hr style={{ border: 'none', height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

              {/* Note Content Body */}
              <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {selectedNote.content}
              </div>

              {/* AI Synergy Box */}
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <Sparkles size={16} /> Mentor Intelligence Integration
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  This note is indexed in your active AI context. When you ask the Mentor about <em>{selectedNote.subject?.name || 'this subject'}</em>, it will reference these exact concepts and adapt practice exam questions accordingly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Creation / Editing Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNoteId ? 'Edit Study Note' : 'Create Study Note'}>
        {formError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} /> {formError}
          </div>
        )}

        <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Subject *</label>
            <select
              style={{ width: '100%' }}
              value={formData.subject}
              onChange={(e) => handleSubjectChangeInForm(e.target.value)}
              required
            >
              <option value="">Select a Subject</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Topic (Optional)</label>
            <select
              style={{ width: '100%' }}
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            >
              <option value="">General Subject Note</option>
              {topics.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Note Title *</label>
            <input
              type="text"
              placeholder="e.g. Normalization (1NF, 2NF, 3NF Rules)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Content *</label>
            <textarea
              rows={8}
              placeholder="Enter your detailed study notes, formulas, explanations, and code snippets..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. database, normalization, exam-prep"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingNoteId ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotesPage;
