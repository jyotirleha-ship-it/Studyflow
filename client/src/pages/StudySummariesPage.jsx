import React, { useEffect, useState } from 'react';
import { FileText, Download, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { studyAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';

const StudySummariesPage = () => {
  const [summaries, setSummaries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedSummary, setSelectedSummary] = useState(null);
  const { t } = useTranslation();

  const loadSummaries = async (p = 1) => {
    try {
      const res = await studyAPI.getSummaries({ page: p, limit: 6 });
      setSummaries(res.data.data || []);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load study summaries', err);
    }
  };

  useEffect(() => {
    loadSummaries(1);
  }, []);

  const handleDownloadPDF = (summaryId) => {
    const token = localStorage.getItem('studyflow_token');
    window.open(`/api/study/summary/${summaryId}/pdf`, '_blank');
  };

  const handleExportMarkdown = (summary) => {
    const content = `# StudyFlow Summary: ${summary.topic}
Subject: ${summary.subject}
Confidence: ${summary.confidenceScore}%

## Important Concepts
${(summary.importantConcepts || []).map(c => `- ${c}`).join('\n')}

## Key Points
${(summary.keyPoints || []).map(p => `- ${p}`).join('\n')}

## Common Mistakes
${(summary.commonMistakes || []).map(m => `- ${m}`).join('\n')}

## Questions to Revise
${(summary.questionsToRevise || []).map(q => `- ${q}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.topic.replace(/\s+/g, '_')}_summary.md`;
    a.click();
  };

  const handleExportTXT = (summary) => {
    const content = `StudyFlow Summary: ${summary.topic}
Subject: ${summary.subject}
Confidence: ${summary.confidenceScore}%

IMPORTANT CONCEPTS:
${(summary.importantConcepts || []).map(c => `* ${c}`).join('\n')}

KEY POINTS:
${(summary.keyPoints || []).map(p => `* ${p}`).join('\n')}

COMMON MISTAKES:
${(summary.commonMistakes || []).map(m => `* ${m}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.topic.replace(/\s+/g, '_')}_summary.txt`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('summaries.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('summaries.subtitle')}</p>
      </div>

      {/* Empty State */}
      {summaries.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
            <FileText size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No study summaries yet.</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Complete study sessions with reflection notes to generate AI synthesis summaries, revision flashpoints, and downloadable PDF reports.
          </p>
        </div>
      )}

      {/* Grid of Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {summaries.map((s) => (
          <div key={s._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.subject || 'General'}</span>
                <span className="badge badge-low">{s.confidenceScore || 85}% confidence</span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '10px' }}>
                {s.topic}
              </h3>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Generated on {new Date(s.createdAt).toLocaleDateString()}
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <strong>Key Takeaway:</strong> {(s.keyPoints && s.keyPoints[0]) || 'Active recall spaced over 48 hours is recommended.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setSelectedSummary(s)}>
                View Details
              </button>
              <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleDownloadPDF(s._id)}>
                <Download size={14} /> PDF
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleExportMarkdown(s)}>
                MD
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleExportTXT(s)}>
                TXT
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={6}
        onPageChange={(p) => loadSummaries(p)}
      />

      {/* Summary Detail Modal */}
      <Modal isOpen={!!selectedSummary} onClose={() => setSelectedSummary(null)} title={selectedSummary?.topic || 'Summary'}>
        {selectedSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                {t('summaries.important_concepts')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(selectedSummary.importantConcepts || []).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>
                {t('summaries.key_points')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(selectedSummary.keyPoints || []).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>
                {t('summaries.common_mistakes')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(selectedSummary.commonMistakes || []).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                {t('summaries.questions_to_revise')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(selectedSummary.questionsToRevise || []).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={() => handleDownloadPDF(selectedSummary._id)}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudySummariesPage;
