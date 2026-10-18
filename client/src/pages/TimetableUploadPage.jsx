import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { timetableAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const TimetableUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a timetable PDF or image file first.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('timetable', file);

    try {
      const res = await timetableAPI.uploadTimetable(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process timetable.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('timetable.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('timetable.subtitle')}</p>
      </div>

      {/* Drag and Drop Zone */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <input
          type="file"
          id="timetable-file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <label
          htmlFor="timetable-file"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UploadCloud size={32} />
          </div>

          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {file ? file.name : t('timetable.dropzone_prompt')}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('timetable.supported_formats')}
          </p>
        </label>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{ padding: '12px 32px' }}
          >
            {uploading ? 'Processing Timetable with AI...' : t('timetable.upload_btn')}
          </button>
        </div>
      </div>

      {/* Results Card */}
      {result && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
            <CheckCircle2 size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Timetable Processed Successfully!</h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Extracted {result.examsExtracted} exam(s) and automatically scheduled {result.tasksScheduled} priority preparation task(s) into your study calendar.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/planner')}>
              View in Planner <ArrowRight size={14} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/calendar')}>
              View in Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableUploadPage;
