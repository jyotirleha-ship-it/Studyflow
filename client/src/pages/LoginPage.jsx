import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import NeuralBackground from '../components/common/NeuralBackground.jsx';
import Modal from '../components/common/Modal.jsx';
import { AlertCircle, Shield, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { authAPI } from '../services/api.js';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localErr, setLocalErr] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrMsg, setForgotErrMsg] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setForgotErrMsg('');
    setForgotSuccessMsg('');
    setForgotLoading(true);

    try {
      const res = await authAPI.forgotPassword({ email: forgotEmail });
      if (res.data?.success) {
        setForgotSuccessMsg(res.data.message || 'Password reset link sent to your email.');
        if (res.data?.resetToken) {
          setResetToken(res.data.resetToken);
        }
        setResetStep(2);
      }
    } catch (err) {
      setForgotErrMsg(err.response?.data?.message || 'Failed to request password reset. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotErrMsg('');
    setForgotSuccessMsg('');

    if (!resetToken.trim()) {
      setForgotErrMsg('Please enter the reset token or code.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotErrMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotErrMsg('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authAPI.resetPassword(resetToken.trim(), { password: newPassword });
      if (res.data?.success) {
        setForgotSuccessMsg(res.data.message || 'Password updated successfully! You can now log in.');
        setEmail(forgotEmail);
        setPassword('');
        setTimeout(() => {
          setShowForgotModal(false);
          setResetStep(1);
        }, 1800);
      }
    } catch (err) {
      setForgotErrMsg(err.response?.data?.message || 'Failed to reset password. The code may be invalid or expired.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    const res = await login(email, password);
    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    setLocalErr('');
    try {
      const res = await authAPI.googleLogin({
        credential: response.credential
      });

      if (res.data?.success) {
        localStorage.setItem('studyflow_token', res.data.token);
        localStorage.setItem('studyflow_user', JSON.stringify(res.data.user));
        window.location.href = res.data.user.role === 'admin' ? '/admin' : '/dashboard';
      }
    } catch (err) {
      setLocalErr(err.response?.data?.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return undefined;

    let timer;
    const initializeGoogle = () => {
      const buttonContainer = document.getElementById('google-signin-button');
      if (!window.google || !buttonContainer) return false;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        ux_mode: 'popup'
      });
      buttonContainer.replaceChildren();
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
        shape: 'rectangular'
      });
      return true;
    };

    if (!initializeGoogle()) {
      timer = window.setInterval(() => {
        if (initializeGoogle()) window.clearInterval(timer);
      }, 100);
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <NeuralBackground />
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', zIndex: 10, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>⚡ StudyFlow</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign in to continue your streak and adaptive plan</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              style={{ width: '100%' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotErrMsg('');
                  setForgotSuccessMsg('');
                  setResetStep(1);
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              style={{ width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '4px' }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <div
          id="google-signin-button"
          style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}
        />
        {!googleClientId && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Google Sign-In is not configured.
          </p>
        )}
        {googleLoading && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Connecting...
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem' }}>
          <Link to="/admin/login" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Shield size={13} /> Administrator Portal
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} title="Reset Password">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {forgotErrMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{forgotErrMsg}</span>
            </div>
          )}

          {forgotSuccessMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={15} />
              <span>{forgotSuccessMsg}</span>
            </div>
          )}

          {resetStep === 1 ? (
            <form onSubmit={handleSendResetLink} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Enter your registered StudyFlow account email. We will generate your password recovery token.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Account Email Address
                </label>
                <input
                  type="email"
                  style={{ width: '100%' }}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResetStep(2)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  Already have a reset code?
                </button>

                <button type="submit" className="btn btn-primary btn-sm" disabled={forgotLoading}>
                  {forgotLoading ? 'Dispatching...' : 'Send Reset Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Enter your authorization token along with your new password.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Reset Token / Code
                </label>
                <input
                  type="text"
                  style={{ width: '100%' }}
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  style={{ width: '100%' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  style={{ width: '100%' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResetStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  ← Request another code
                </button>

                <button type="submit" className="btn btn-primary btn-sm" disabled={resetLoading}>
                  <KeyRound size={14} />
                  <span>{resetLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', textAlign: 'center' }}>
            <Link
              to="/forgot-password"
              onClick={() => setShowForgotModal(false)}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              Open Dedicated Forgot Password Page →
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
