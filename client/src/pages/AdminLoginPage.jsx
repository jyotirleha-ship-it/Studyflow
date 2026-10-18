import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import NeuralBackground from '../components/common/NeuralBackground.jsx';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';

const AdminLoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localErr, setLocalErr] = useState('');

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');

    const res = await login(email, password);
    if (res.success) {
      if (res.user?.role !== 'admin') {
        setLocalErr('Access Denied: The authenticated account does not have administrator privileges.');
        return;
      }
      navigate('/admin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <NeuralBackground />
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', zIndex: 10, position: 'relative', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin Portal Login</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Authorized study operating system administrators only</p>
        </div>

        {(error || localErr) && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--accent-rose)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error || localErr}</span>
          </div>
        )}

        <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Admin Email</label>
            <input
              type="email"
              style={{ width: '100%' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@studyflow.ai"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              style={{ width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#ef4444', borderColor: '#dc2626', width: '100%', marginTop: '4px' }}>
            {loading ? 'Verifying Credentials...' : 'Access Admin Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Return to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
