import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Users,
  Bell,
  BookOpen,
  Plus,
  Shield,
  MessageCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { groupAPI } from '../services/api.js';
import Modal from '../components/common/Modal.jsx';
import './groupChat.css';

const GroupChat = () => {
  const { groupId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  const messagesEndRef = useRef(null);

  const fetchGroupData = useCallback(async () => {
    try {
      const [groupRes, msgRes] = await Promise.all([
        groupAPI.getGroupById(groupId),
        groupAPI.getMessages(groupId)
      ]);

      if (groupRes.data?.success) {
        setGroup(groupRes.data.group);
      }
      if (msgRes.data?.success) {
        setMessages(msgRes.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load group chat data', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      groupAPI.getMessages(groupId).then((res) => {
        if (res.data?.success) {
          setMessages(res.data.messages || []);
        }
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGroupData, groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await groupAPI.sendMessage(groupId, { content: messageText });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) return;

    try {
      const res = await groupAPI.addAnnouncement(groupId, announcementForm);
      if (res.data?.success) {
        setAnnouncementModalOpen(false);
        setAnnouncementForm({ title: '', content: '' });
        fetchGroupData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement');
    }
  };

  if (loading) {
    return <div className="loading-state-box">Connecting to group discussion...</div>;
  }

  if (!group) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <h3>Study Group Not Found</h3>
        <Link to="/study-groups" className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to Study Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="group-chat-page-layout">
      {/* Main Chat Area */}
      <div className="group-chat-main glass-card">
        {/* Chat Room Header */}
        <div className="chat-room-header">
          <div className="header-left">
            <Link to="/study-groups" className="btn-back-icon" title="Back to Groups">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="room-title-row">
                <h2>{group.name}</h2>
                <span className="room-subject-badge">{group.subject}</span>
              </div>
              <span className="room-subtitle">
                {group.memberCount} active study partners • Real-time discussion
              </span>
            </div>
          </div>

          <div className="header-right">
            <Link to="/shared-notes" className="btn btn-secondary btn-sm">
              <BookOpen size={14} /> Group Notes
            </Link>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages-stream">
          {messages.length === 0 ? (
            <div className="chat-empty-stream">
              <MessageCircle size={40} className="text-muted" />
              <h4>Welcome to {group.name}!</h4>
              <p>Say hello to your fellow study partners or ask your first doubt.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender?._id?.toString() === currentUser?._id?.toString();
              return (
                <div key={msg._id} className={`chat-message-row ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && (
                    <div className="sender-avatar-bubble">
                      {msg.sender?.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="message-content-bubble">
                    {!isMine && (
                      <div className="sender-name-label">
                        {msg.sender?.name || 'Classmate'}
                      </div>
                    )}
                    <div className="message-text">{msg.content}</div>
                    <div className="message-timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="chat-input-bar">
          <input
            type="text"
            placeholder={`Message ${group.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={!inputText.trim() || sending}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Sidebar: Announcements & Members */}
      <div className="group-chat-sidebar">
        {/* Announcements Box */}
        <div className="sidebar-card glass-card">
          <div className="sidebar-card-header">
            <div className="header-label">
              <Bell size={16} className="text-amber" />
              <span>Announcements</span>
            </div>
            {group.isMember && (
              <button
                className="btn-icon-add"
                onClick={() => setAnnouncementModalOpen(true)}
                title="Post Announcement"
              >
                <Plus size={15} />
              </button>
            )}
          </div>

          <div className="announcements-list">
            {(group.announcements || []).length === 0 ? (
              <div className="empty-subtext">No announcements posted yet.</div>
            ) : (
              (group.announcements || []).map((ann, idx) => (
                <div key={idx} className="announcement-card-item">
                  <h4>{ann.title}</h4>
                  <p>{ann.content}</p>
                  <span className="ann-date">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Group Members Box */}
        <div className="sidebar-card glass-card">
          <div className="sidebar-card-header">
            <div className="header-label">
              <Users size={16} className="text-primary" />
              <span>Members ({group.members?.length || 0})</span>
            </div>
          </div>

          <div className="members-roster-list">
            {(group.members || []).map((m, idx) => (
              <div key={idx} className="member-roster-item">
                <div className="member-roster-avatar">
                  {m.user?.name?.charAt(0) || 'M'}
                </div>
                <div className="member-roster-info">
                  <div className="member-roster-name">
                    {m.user?.name || 'Classmate'}
                    {m.role === 'admin' && <Shield size={12} className="admin-badge-icon" />}
                  </div>
                  <span className="member-roster-dept">
                    {m.user?.department || 'Computer Science'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post Announcement Modal */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="Post Group Announcement"
      >
        <form onSubmit={handlePostAnnouncement} className="create-group-form">
          <div className="form-field-group">
            <label>Announcement Title *</label>
            <input
              type="text"
              placeholder="e.g. Schedule for revision session"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Details / Content *</label>
            <textarea
              rows="4"
              placeholder="Provide links, timestamps, or discussion topics..."
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={() => setAnnouncementModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Post Announcement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupChat;
