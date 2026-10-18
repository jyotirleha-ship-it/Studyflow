import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NeuralBackground from '../components/common/NeuralBackground.jsx';
import { AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { authAPI } from '../services/api.js';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenHint, setTokenHint] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setTokenHint('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data?.success) {
        setMessage(res.data.message || 'Password reset link sent to your email.');
        if (res.data?.resetToken) {
          setTokenHint(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset. Please verify your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <NeuralBackground />
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', zIndex: 10, position: 'relative', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>⚡ StudyFlow</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyRound size={22} className="text-primary" /> Forgot Password
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
              <CheckCircle2 size={16} />
              <span>Email Dispatched!</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem' }}>{message}</p>

            {tokenHint && (
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Testing / Quick Reset Code:
                </div>
                <code style={{ fontSize: '0.85rem', color: '#38bdf8', wordBreak: 'break-all' }}>{tokenHint}</code>
                <div style={{ marginTop: '8px' }}>
                  <Link to={`/reset-password/${tokenHint}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                    Proceed to Reset Form →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
              Registered Email Address
            </label>
            <input
              type="email"
              style={{ width: '100%' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
            <Mail size={16} />
            <span>{loading ? 'Dispatching Reset Link...' : 'Send Password Reset Link'}</span>
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={15} /> Back to Sign In
          </Link>

          <Link to="/reset-password" style={{ color: 'var(--text-secondary)' }}>
            Have a reset code?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
